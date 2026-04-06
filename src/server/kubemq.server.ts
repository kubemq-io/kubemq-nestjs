import {
  CustomTransportStrategy,
  Server,
  type MessageHandler,
  type ConsumerSerializer,
  type ConsumerDeserializer,
} from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { KubeMQClient as KubeMQSDKClient } from 'kubemq-js';
import type {
  Subscription,
  CommandReceived,
  QueryReceived,
  EventReceived,
  EventStoreReceived,
  QueueStreamHandle,
  QueueStreamMessage,
  EventStoreStartPosition,
} from 'kubemq-js';
import { ValidationError } from 'kubemq-js';

import type { KubeMQServerOptions } from '../interfaces/index.js';
import type { KubeMQSerializer, KubeMQDeserializer } from '../serialization/interfaces.js';
import { KubeMQContext } from '../context/kubemq.context.js';
import { KubeMQRequestContext } from '../context/kubemq-request.context.js';
import { KubeMQEventStoreContext } from '../context/kubemq-event-store.context.js';
import { KubeMQQueueContext } from '../context/kubemq-queue.context.js';
import { KubeMQQueueBatchContext } from '../context/kubemq-queue-batch.context.js';
import { TAG_PATTERN, TAG_ID, TAG_CONTENT_TYPE } from '../constants.js';
import type { KubeMQPatternType } from '../constants.js';
import type { KubeMQHandlerMetadata } from '../interfaces/handler-metadata.interface.js';
import { createNestKubeMQLogger } from '../observability/logger-bridge.js';
import { serializeBody, deserializeBody } from '../serialization/helpers.js';
import { toError, errorMessage, isConnectionError } from '../utils/error-helpers.js';
import { KubeMQStatus } from '../events/kubemq.events.js';
import { ReconnectManager } from './reconnect-manager.js';
import { HandlerExecutor } from './handler-executor.js';

export class KubeMQServer extends Server implements CustomTransportStrategy {
  protected readonly logger = new Logger('KubeMQServer');
  private client: KubeMQSDKClient | null = null;
  private readonly subscriptions: Subscription[] = [];
  private readonly queueStreams: QueueStreamHandle[] = [];
  private readonly options: KubeMQServerOptions;
  private readonly pendingEventListeners: Array<{
    event: string;
    callback: (...args: any[]) => void;
  }> = [];

  private readonly reconnect: ReconnectManager;
  private readonly executor = new HandlerExecutor();
  private readonly subscriptionErrors = new Map<string, string>();

  constructor(options: KubeMQServerOptions) {
    super();
    this.options = options;
    this.reconnect = new ReconnectManager(() => this.options.reconnect, this.logger);
    if (options.serializer) {
      this.serializer = this.wrapSerializer(options.serializer);
    }
    if (options.deserializer) {
      this.deserializer = this.wrapDeserializer(options.deserializer);
    }
  }

  /**
   * Start the transport: connect to KubeMQ, bind all handlers, invoke callback.
   *
   * @param callback - Called once all subscriptions are established.
   */
  async listen(callback: () => void): Promise<void> {
    try {
      await this.connectAndBindHandlers();
      callback();
    } catch (error) {
      if (this.options.waitForConnection !== false) {
        throw error;
      }
      if (!isConnectionError(error)) {
        throw error;
      }
      this.logger.error(`Failed to connect to KubeMQ: ${errorMessage(error)}`);
      this._status$.next(KubeMQStatus.DISCONNECTED);
      callback();
      this._status$.next(KubeMQStatus.RECONNECTING);
      this.reconnect.startLoop(
        () => this.attemptReconnection(),
        () => {
          this.pendingEventListeners.length = 0;
        },
      );
    }
  }

  /**
   * Gracefully shut down: drain in-flight work, cancel subscriptions, close client.
   */
  async close(): Promise<void> {
    this.logger.log('Shutting down KubeMQ transport...');

    this.reconnect.cancelLoop();

    const drainMs = (this.options.callbackTimeoutSeconds ?? 30) * 1000;
    await this.executor.drain(drainMs);

    this.pendingEventListeners.length = 0;

    for (const sub of this.subscriptions) {
      try {
        sub.cancel();
      } catch (err) {
        this.logger.warn(`Error cancelling subscription: ${errorMessage(err)}`);
      }
    }
    this.subscriptions.length = 0;

    for (const stream of this.queueStreams) {
      try {
        stream.close();
      } catch (err) {
        this.logger.warn(`Error closing queue stream: ${errorMessage(err)}`);
      }
    }
    this.queueStreams.length = 0;

    if (this.client) {
      try {
        await this.client.close({
          timeoutSeconds: 5,
          callbackTimeoutSeconds: this.options.callbackTimeoutSeconds ?? 30,
        });
      } catch (err) {
        this.logger.error(`Error closing KubeMQ client: ${errorMessage(err)}`);
      }
      this.client = null;
    }

    this.subscriptionErrors.clear();

    this._status$.next(KubeMQStatus.CLOSED);
    this.logger.log('KubeMQ transport shut down');
  }

  /**
   * Returns the underlying kubemq-js client instance.
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- required by abstract base class
  unwrap<T = KubeMQSDKClient>(): T {
    if (!this.client) {
      throw new Error(
        'Not initialized. Please call the "listen"/"startAllMicroservices" method before accessing the server.',
      );
    }
    return this.client as T;
  }

  /**
   * Per-channel subscription errors (commands, queries, events, queues) for health wiring.
   */
  getSubscriptionErrors(): ReadonlyMap<string, string> {
    return this.subscriptionErrors;
  }

  /**
   * @deprecated Use {@link getSubscriptionErrors}.
   */
  getStreamErrorState(): ReadonlyMap<string, string> {
    return this.getSubscriptionErrors();
  }

  /**
   * Registers an event listener. If the client is not yet connected,
   * the listener is queued and replayed once the client is available.
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(event: string, callback: Function): void {
    if (this.reconnect.isClosing) {
      return;
    }
    if (this.client) {
      (this.client as any).on(event, callback);
    } else {
      this.pendingEventListeners.push({
        event,
        callback: callback as (...args: any[]) => void,
      });
    }
  }

  private async attemptReconnection(): Promise<void> {
    await this.connectAndBindHandlers();
    this.logger.log('Successfully reconnected and bound all handlers');
  }

  private async connectAndBindHandlers(): Promise<void> {
    if (this.reconnect.isClosing) {
      return;
    }

    const created = await KubeMQSDKClient.create({
      address: this.options.address,
      clientId: this.options.clientId,
      credentials: this.options.credentials,
      tls: this.options.tls,
      retry: this.options.retry,
      reconnect: this.options.reconnect,
      keepalive: this.options.keepalive,
      logger: createNestKubeMQLogger('KubeMQServer'),
      tracerProvider: this.options.tracerProvider,
      meterProvider: this.options.meterProvider,
    });

    if (this.reconnect.isClosing) {
      try {
        await created.close({ timeoutSeconds: 2 });
      } catch {
        /* swallow */
      }
      return;
    }

    this.client = created;

    this.setupConnectionListeners();
    this.replayPendingListeners();

    try {
      for (const [pattern, handler] of this.messageHandlers) {
        const metadata = this.parseHandlerMetadata(handler.extras);
        await this.bindHandler(pattern, handler, metadata);
      }
    } catch (bindError) {
      await this.rollbackBindings();
      throw bindError;
    }

    this._status$.next(KubeMQStatus.CONNECTED);
  }

  private async rollbackBindings(): Promise<void> {
    for (const sub of this.subscriptions) {
      try {
        sub.cancel();
      } catch {
        /* swallow */
      }
    }
    this.subscriptions.length = 0;
    for (const stream of this.queueStreams) {
      try {
        stream.close();
      } catch {
        /* swallow */
      }
    }
    this.queueStreams.length = 0;
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        /* swallow */
      }
      this.client = null;
    }
  }

  private async bindHandler(
    pattern: string,
    handler: MessageHandler,
    metadata: KubeMQHandlerMetadata,
  ): Promise<void> {
    const type = this.resolvePatternType(handler, metadata);

    switch (type) {
      case 'command':
        this.bindCommandHandler(pattern, handler, metadata);
        break;
      case 'query':
        this.bindQueryHandler(pattern, handler, metadata);
        break;
      case 'event':
        this.bindEventHandler(pattern, handler, metadata);
        break;
      case 'event_store':
        this.bindEventStoreHandler(pattern, handler, metadata);
        break;
      case 'queue':
        this.bindQueueHandler(pattern, handler, metadata);
        break;
      default:
        if (handler.isEventHandler) {
          this.bindEventHandler(pattern, handler, metadata);
        } else {
          this.bindCommandHandler(pattern, handler, metadata);
        }
    }
  }

  private resolvePatternType(
    handler: MessageHandler,
    metadata: KubeMQHandlerMetadata,
  ): KubeMQPatternType {
    if (metadata.type) {
      return metadata.type;
    }

    if (metadata.query === true) return 'query';
    if (metadata.store === true) return 'event_store';
    if (metadata.queue === true) return 'queue';

    if (handler.isEventHandler) {
      return 'event';
    }

    return 'command';
  }

  private bindCommandHandler(
    channel: string,
    handler: MessageHandler,
    metadata: KubeMQHandlerMetadata,
  ): void {
    const group = metadata.group ?? this.options.group;
    const maxConcurrent = metadata.maxConcurrent;

    const sub = this.client!.subscribeToCommands(
      {
        channel,
        group,
        onCommand: (cmd: CommandReceived) =>
          this.executor.track(() =>
            this.handleRequestMessage(cmd, channel, 'command', handler, (resp) =>
              this.client!.sendCommandResponse(resp),
            ),
          ),
        onError: (err) => {
          const msg = errorMessage(err);
          this.logger.error(`Command subscription error on ${channel}: ${msg}`);
          this.subscriptionErrors.set(channel, msg);
        },
      },
      maxConcurrent ? { maxConcurrentCallbacks: maxConcurrent } : undefined,
    );

    this.subscriptions.push(sub);
    this.logger.log(`Bound command handler: ${channel}${group ? ` (group: ${group})` : ''}`);
  }

  private bindQueryHandler(
    channel: string,
    handler: MessageHandler,
    metadata: KubeMQHandlerMetadata,
  ): void {
    const group = metadata.group ?? this.options.group;
    const maxConcurrent = metadata.maxConcurrent;

    const sub = this.client!.subscribeToQueries(
      {
        channel,
        group,
        onQuery: (query: QueryReceived) =>
          this.executor.track(() =>
            this.handleRequestMessage(query, channel, 'query', handler, (resp) =>
              this.client!.sendQueryResponse(resp),
            ),
          ),
        onError: (err) => {
          const msg = errorMessage(err);
          this.logger.error(`Query subscription error on ${channel}: ${msg}`);
          this.subscriptionErrors.set(channel, msg);
        },
      },
      maxConcurrent ? { maxConcurrentCallbacks: maxConcurrent } : undefined,
    );

    this.subscriptions.push(sub);
    this.logger.log(`Bound query handler: ${channel}${group ? ` (group: ${group})` : ''}`);
  }

  private async handleRequestMessage(
    msg: CommandReceived | QueryReceived,
    channel: string,
    patternType: 'command' | 'query',
    handler: MessageHandler,
    sendResponse: (resp: {
      id: string;
      replyChannel: string;
      clientId?: string;
      executed: boolean;
      error?: string;
      body?: Uint8Array;
      tags?: Record<string, string>;
    }) => Promise<unknown>,
  ): Promise<void> {
    try {
      const data = deserializeBody(msg.body, msg.tags, this.options.deserializer);
      const ctx = new KubeMQRequestContext([
        {
          channel: msg.channel,
          id: msg.id,
          timestamp: msg.timestamp,
          tags: msg.tags,
          metadata: msg.metadata,
          patternType: patternType as KubeMQPatternType,
          fromClientId: msg.fromClientId,
          replyChannel: msg.replyChannel,
        },
      ]);

      const result$ = this.transformToObservable(await handler(data, ctx));

      let response: unknown;
      let error: string | undefined;
      try {
        response = await this.executor.executeRpc(
          result$,
          this.getHandlerTimeoutMs(patternType),
        );
      } catch (err) {
        const normalized = toError(err);
        this.logger.warn(
          `${patternType} handler error on ${channel} [${msg.id}]: ${normalized.message}`,
        );
        if (normalized.name === 'EmptyError') {
          error = 'Handler completed without emitting a response';
        } else if (normalized.name === 'TimeoutError') {
          error = 'Handler timed out';
        } else {
          error = normalized.message || 'Unknown handler error';
        }
      }

      this.subscriptionErrors.delete(channel);

      const sanitizedError = error
        ? this.options.verboseErrors
          ? error
          : 'Internal handler error'
        : undefined;

      const responseTags: Record<string, string> = {
        [TAG_PATTERN]: channel,
        [TAG_ID]: msg.id,
      };
      if (this.options.serializer?.contentType) {
        responseTags[TAG_CONTENT_TYPE] = this.options.serializer.contentType;
      }

      await sendResponse({
        id: msg.id,
        replyChannel: msg.replyChannel,
        clientId: this.options.clientId,
        executed: !error,
        error: sanitizedError,
        body: response !== undefined ? serializeBody(response, this.options.serializer) : undefined,
        tags: responseTags,
      });
    } catch (outerErr) {
      this.logger.error(`Error handling ${patternType} on ${channel}: ${errorMessage(outerErr)}`);
      try {
        await sendResponse({
          id: msg.id,
          replyChannel: msg.replyChannel,
          clientId: this.options.clientId,
          executed: false,
          error: this.options.verboseErrors ? errorMessage(outerErr) : 'Internal handler error',
        });
      } catch (sendErr) {
        this.logger.error(
          `Failed to send error response for ${patternType} ${msg.id} on ${channel}: ${errorMessage(sendErr)}`,
        );
      }
    }
  }

  private bindEventHandler(
    channel: string,
    handler: MessageHandler,
    metadata: KubeMQHandlerMetadata,
  ): void {
    const group = metadata.group ?? this.options.group;
    const maxConcurrent = metadata.maxConcurrent;

    const sub = this.client!.subscribeToEvents(
      {
        channel,
        group,
        onEvent: (event: EventReceived) =>
          this.executor.track(async () => {
            try {
              const data = deserializeBody(event.body, event.tags, this.options.deserializer);

              const ctx = new KubeMQContext([
                {
                  channel: event.channel,
                  id: event.id,
                  timestamp: event.timestamp,
                  tags: event.tags,
                  metadata: event.metadata,
                  patternType: 'event' as KubeMQPatternType,
                },
              ]);

              const result$ = this.transformToObservable(await handler(data, ctx));
              await this.executor.executeWithDefault(
                result$,
                this.getHandlerTimeoutMs('command'),
              );
              this.subscriptionErrors.delete(channel);
            } catch (err) {
              this.logger.error(`Error handling event on ${channel}: ${errorMessage(err)}`);
            }
          }),
        onError: (err) => {
          const msg = errorMessage(err);
          this.logger.error(`Event subscription error on ${channel}: ${msg}`);
          this.subscriptionErrors.set(channel, msg);
        },
      },
      maxConcurrent ? { maxConcurrentCallbacks: maxConcurrent } : undefined,
    );

    this.subscriptions.push(sub);
    this.logger.log(`Bound event handler: ${channel}${group ? ` (group: ${group})` : ''}`);
  }

  private bindEventStoreHandler(
    channel: string,
    handler: MessageHandler,
    metadata: KubeMQHandlerMetadata,
  ): void {
    const group = metadata.group ?? this.options.group;
    const maxConcurrent = metadata.maxConcurrent;

    const startFrom = this.resolveEventStoreStartPosition(metadata);
    const startValue = metadata.startValue ?? this.options.eventsStore?.startValue;

    const sub = this.client!.subscribeToEventsStore(
      {
        channel,
        group,
        startFrom,
        startValue,
        onEvent: (event: EventStoreReceived) =>
          this.executor.track(async () => {
            try {
              const data = deserializeBody(event.body, event.tags, this.options.deserializer);

              const ctx = new KubeMQEventStoreContext([
                {
                  channel: event.channel,
                  id: event.id,
                  timestamp: event.timestamp,
                  tags: event.tags,
                  metadata: event.metadata,
                  patternType: 'event_store' as KubeMQPatternType,
                  sequence: event.sequence,
                },
              ]);

              const result$ = this.transformToObservable(await handler(data, ctx));
              await this.executor.executeWithDefault(
                result$,
                this.getHandlerTimeoutMs('command'),
              );
              this.subscriptionErrors.delete(channel);
            } catch (err) {
              this.logger.error(`Error handling event-store on ${channel}: ${errorMessage(err)}`);
            }
          }),
        onError: (err) => {
          const msg = errorMessage(err);
          this.logger.error(`EventStore subscription error on ${channel}: ${msg}`);
          this.subscriptionErrors.set(channel, msg);
        },
      },
      maxConcurrent ? { maxConcurrentCallbacks: maxConcurrent } : undefined,
    );

    this.subscriptions.push(sub);
    this.logger.log(
      `Bound event-store handler: ${channel} (startFrom: ${startFrom})${group ? ` (group: ${group})` : ''}`,
    );
  }

  private resolveEventStoreStartPosition(metadata: KubeMQHandlerMetadata): EventStoreStartPosition {
    const startFrom = metadata.startFrom ?? this.options.eventsStore?.startFrom ?? 'new';
    if (typeof startFrom === 'number' && startFrom >= 1 && startFrom <= 6) {
      return startFrom as EventStoreStartPosition;
    }
    const map: Record<string, number> = {
      new: 1,
      first: 2,
      last: 3,
      sequence: 4,
      time: 5,
      timeDelta: 6,
    };
    const resolved = map[startFrom as string];
    if (resolved === undefined) {
      throw new ValidationError({
        message: `Invalid event-store startFrom value: "${String(startFrom)}". Valid values: new, first, last, sequence, time, timeDelta, 1-6`,
        operation: 'resolveEventStoreStartPosition',
      });
    }
    return resolved as EventStoreStartPosition;
  }

  private bindQueueHandler(
    channel: string,
    handler: MessageHandler,
    metadata: KubeMQHandlerMetadata,
  ): void {
    const manualAck = metadata.manualAck === true;
    const batchMode = metadata.batch === true;
    const maxMessages =
      metadata.maxMessages ?? this.options.queue?.maxMessages ?? (batchMode ? 10 : 1);
    const waitTimeoutSeconds =
      metadata.waitTimeoutSeconds ?? this.options.queue?.waitTimeoutSeconds ?? 30;

    const streamHandle = this.client!.streamQueueMessages({
      channel,
      autoAck: false,
      maxMessages,
      waitTimeoutSeconds,
    });

    streamHandle.onMessages(async (messages: QueueStreamMessage[]) => {
      if (batchMode) {
        await this.handleQueueBatch(channel, messages, handler, manualAck);
      } else {
        await this.handleQueueSingle(channel, messages, handler, manualAck);
      }
    });

    streamHandle.onError((err) => {
      const msg = errorMessage(err);
      this.logger.error(`Queue stream error on ${channel}: ${msg}`);
      this.subscriptionErrors.set(channel, msg);
    });

    this.queueStreams.push(streamHandle);
    this.logger.log(
      `Bound queue handler: ${channel} (manualAck: ${manualAck}, batch: ${batchMode})`,
    );
  }

  private async handleQueueSingle(
    channel: string,
    messages: QueueStreamMessage[],
    handler: MessageHandler,
    manualAck: boolean,
  ): Promise<void> {
    for (const msg of messages) {
      await this.executor.track(async () => {
        try {
          const data = deserializeBody(msg.body, msg.tags, this.options.deserializer);

          const ctx = new KubeMQQueueContext([
            {
              channel: msg.channel,
              id: msg.id,
              timestamp: msg.timestamp,
              tags: msg.tags,
              metadata: msg.metadata,
              patternType: 'queue' as KubeMQPatternType,
              sequence: msg.sequence,
              receiveCount: msg.receiveCount,
              isReRouted: msg.isReRouted,
              reRouteFromQueue: msg.reRouteFromQueue,
              _rawMessage: manualAck ? msg : null,
            },
          ]);

          const result$ = this.transformToObservable(await handler(data, ctx));
          await this.executor.executeWithDefault(result$, this.getHandlerTimeoutMs('command'));

          this.subscriptionErrors.delete(channel);

          if (!manualAck) {
            msg.ack();
          }
        } catch (err) {
          this.logger.error(`Error handling queue message on ${channel}: ${errorMessage(err)}`);
          if (!manualAck) {
            msg.nack();
          }
        }
      });
    }
  }

  private async handleQueueBatch(
    channel: string,
    messages: QueueStreamMessage[],
    handler: MessageHandler,
    manualAck: boolean,
  ): Promise<void> {
    await this.executor.track(async () => {
      try {
        const contexts: KubeMQQueueContext[] = [];
        const payloads: unknown[] = [];

        for (const msg of messages) {
          payloads.push(deserializeBody(msg.body, msg.tags, this.options.deserializer));
          contexts.push(
            new KubeMQQueueContext([
              {
                channel: msg.channel,
                id: msg.id,
                timestamp: msg.timestamp,
                tags: msg.tags,
                metadata: msg.metadata,
                patternType: 'queue' as KubeMQPatternType,
                sequence: msg.sequence,
                receiveCount: msg.receiveCount,
                isReRouted: msg.isReRouted,
                reRouteFromQueue: msg.reRouteFromQueue,
                _rawMessage: manualAck ? msg : null,
              },
            ]),
          );
        }

        const batchCtx = new KubeMQQueueBatchContext(contexts, messages, manualAck);
        const result$ = this.transformToObservable(await handler(payloads, batchCtx));
        await this.executor.executeWithDefault(result$, this.getHandlerTimeoutMs('command'));

        this.subscriptionErrors.delete(channel);

        if (!manualAck) {
          for (const msg of messages) {
            msg.ack();
          }
        }
      } catch (err) {
        this.logger.error(`Error handling queue batch on ${channel}: ${errorMessage(err)}`);
        if (!manualAck) {
          for (const msg of messages) {
            msg.nack();
          }
        }
      }
    });
  }

  private setupConnectionListeners(): void {
    this.client!.on('connected', () => {
      this._status$.next(KubeMQStatus.CONNECTED);
      this.logger.log('Connected to KubeMQ broker');
    });
    this.client!.on('disconnected', () => {
      this._status$.next(KubeMQStatus.DISCONNECTED);
      this.logger.warn('Disconnected from KubeMQ broker');
    });
    this.client!.on('reconnecting', () => {
      this._status$.next(KubeMQStatus.RECONNECTING);
      this.logger.log('Reconnecting to KubeMQ broker...');
    });
    this.client!.on('reconnected', () => {
      this._status$.next(KubeMQStatus.CONNECTED);
      this.logger.log('Reconnected to KubeMQ broker');
    });
    this.client!.on('closed', () => {
      this._status$.next(KubeMQStatus.CLOSED);
      this.logger.log('KubeMQ client closed');
    });
    this.client!.on('bufferDrain', (discardedCount) => {
      this.logger.warn(`Reconnect buffer drained: ${discardedCount} messages discarded`);
    });
    this.client!.on('stateChange', (state) => {
      this.logger.debug(`Connection state changed to: ${state}`);
    });
  }

  private replayPendingListeners(): void {
    for (const { event, callback: cb } of this.pendingEventListeners) {
      (this.client as any).on(event, cb);
    }
    this.pendingEventListeners.length = 0;
  }

  private parseHandlerMetadata(extras?: Record<string, unknown>): KubeMQHandlerMetadata {
    return (extras ?? {}) as KubeMQHandlerMetadata;
  }

  private getHandlerTimeoutMs(patternType: 'command' | 'query'): number {
    if (patternType === 'query') {
      return (
        (this.options.defaultQueryTimeout ?? this.options.defaultCommandTimeout ?? 10) * 1000
      );
    }
    return (this.options.defaultCommandTimeout ?? 10) * 1000;
  }

  private wrapSerializer(serializer: KubeMQSerializer): ConsumerSerializer {
    return {
      serialize(value: any): any {
        return serializer.serialize(value);
      },
    };
  }

  private wrapDeserializer(deserializer: KubeMQDeserializer): ConsumerDeserializer {
    return {
      deserialize(value: any): any {
        if (value instanceof Uint8Array) {
          return deserializer.deserialize(value);
        }
        return value;
      },
    };
  }
}
