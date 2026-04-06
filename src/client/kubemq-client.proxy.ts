import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import { Logger, OnApplicationShutdown } from '@nestjs/common';
import { KubeMQClient as KubeMQSDKClient, ConnectionNotReadyError } from 'kubemq-js';
import type { CommandResponse, QueryResponse, QueueSendResult, EventStoreResult } from 'kubemq-js';
import type { KubeMQClientOptions } from '../interfaces/kubemq-client-options.interface.js';
import { TAG_PATTERN, TAG_TYPE, TAG_CONTENT_TYPE } from '../constants.js';
import { mapErrorToRpcException, mapToRpcException } from '../errors/error-mapper.js';
import { isKubeMQRecord } from './kubemq-record.js';
import { serializeBody, deserializeBody } from '../serialization/helpers.js';
import { toError } from '../utils/error-helpers.js';
import { createNestKubeMQLogger } from '../observability/logger-bridge.js';
import { KubeMQStatus } from '../events/kubemq.events.js';

function mergeWireTags(
  base: Record<string, string>,
  user?: Record<string, string>,
): Record<string, string> {
  const out = { ...base };
  if (!user) return out;
  for (const [k, v] of Object.entries(user)) {
    if (k.startsWith('nestjs:')) continue;
    out[k] = v;
  }
  return out;
}

export class KubeMQClientProxy extends ClientProxy implements OnApplicationShutdown {
  protected readonly logger = new Logger('KubeMQClientProxy');
  protected client: KubeMQSDKClient | null = null;
  protected readonly options: KubeMQClientOptions;
  private connectPromise: Promise<void> | null = null;
  private closing = false;

  constructor(options: KubeMQClientOptions) {
    super();
    this.options = options;
  }

  private get verboseErrors(): boolean {
    return this.options.verboseErrors === true;
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- required by abstract base class
  unwrap<T>(): T {
    if (!this.client) {
      throw new Error('Not initialized. Please call the "connect" method first.');
    }
    return this.client as T;
  }

  async connect(): Promise<void> {
    if (this.closing) {
      throw new ConnectionNotReadyError({
        message: 'KubeMQ client is closing.',
        operation: 'connect',
      });
    }
    if (this.client) return;
    if (this.connectPromise) {
      await this.connectPromise;
      return;
    }

    this.connectPromise = this.doConnect();
    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  private async doConnect(): Promise<void> {
    const created = await KubeMQSDKClient.create({
      address: this.options.address,
      clientId: this.options.clientId,
      credentials: this.options.credentials,
      tls: this.options.tls,
      retry: this.options.retry,
      reconnect: this.options.reconnect,
      keepalive: this.options.keepalive,
      logger: createNestKubeMQLogger('KubeMQClientProxy'),
      tracerProvider: this.options.tracerProvider,
      meterProvider: this.options.meterProvider,
    });

    if (this.closing) {
      try {
        const timeoutSeconds = this.options.callbackTimeoutSeconds ?? 5;
        await created.close({ timeoutSeconds, callbackTimeoutSeconds: timeoutSeconds });
      } catch {
        /* swallow */
      }
      return;
    }

    this.client = created;
    this._status$.next(KubeMQStatus.CONNECTED);

    this.client.on('connected', () => {
      this._status$.next(KubeMQStatus.CONNECTED);
      this.logger.log('Client connected to KubeMQ broker');
    });
    this.client.on('disconnected', () => {
      this._status$.next(KubeMQStatus.DISCONNECTED);
      this.logger.warn('Client disconnected from KubeMQ broker');
    });
    this.client.on('reconnecting', () => {
      this._status$.next(KubeMQStatus.RECONNECTING);
      this.logger.log('Client reconnecting to KubeMQ broker...');
    });
    this.client.on('reconnected', () => {
      this._status$.next(KubeMQStatus.CONNECTED);
      this.logger.log('Client reconnected to KubeMQ broker');
    });
    this.client.on('closed', () => {
      this._status$.next(KubeMQStatus.CLOSED);
      this.logger.log('KubeMQ client closed');
    });
    this.client.on('bufferDrain', (discardedCount) => {
      this.logger.warn(`Reconnect buffer drained: ${discardedCount} messages discarded`);
    });
    this.client.on('stateChange', (state) => {
      this.logger.debug?.(`Connection state changed to: ${state}`);
    });
  }

  async close(): Promise<void> {
    this.closing = true;
    if (this.connectPromise) {
      try {
        await this.connectPromise;
      } catch {
        /* connect may have failed */
      }
    }
    if (this.client) {
      try {
        const timeoutSeconds = this.options.callbackTimeoutSeconds ?? 5;
        await this.client.close({ timeoutSeconds, callbackTimeoutSeconds: timeoutSeconds });
      } finally {
        this.client = null;
      }
    }
    this._status$.next(KubeMQStatus.CLOSED);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }

  protected publish(packet: ReadPacket, callback: (packet: WritePacket) => void): () => void {
    if (!this.client) {
      callback({
        err: new ConnectionNotReadyError({
          message: 'KubeMQ client is not connected. Call connect() first.',
          operation: 'publish',
        }),
        isDisposed: true,
      });
      return () => {};
    }

    const { metadata, data, userTags } = this.extractPacketMetadata(packet);
    const isQuery = metadata?.type === 'query';
    const channel =
      typeof packet.pattern === 'string' ? packet.pattern : JSON.stringify(packet.pattern);

    const serializedBody = serializeBody(data, this.options.serializer);
    const baseTags: Record<string, string> = {
      [TAG_PATTERN]: channel,
      [TAG_TYPE]: isQuery ? 'query' : 'command',
      [TAG_CONTENT_TYPE]: this.options.serializer?.contentType ?? 'application/json',
    };
    const tags = mergeWireTags(baseTags, userTags);

    const abortController = new AbortController();

    if (isQuery) {
      const timeout =
        (metadata?.timeout as number | undefined) ?? this.options.defaultQueryTimeout ?? 10;
      const cacheKey = metadata?.cacheKey as string | undefined;
      const cacheTtl = metadata?.cacheTtl as number | undefined;

      this.client
        .sendQuery(
          {
            channel,
            body: serializedBody,
            timeoutInSeconds: timeout,
            tags,
            cacheKey,
            cacheTtlInSeconds: cacheTtl,
          },
          { signal: abortController.signal },
        )
        .then((response: QueryResponse) => {
          if (response.executed) {
            const responseData = response.body
              ? deserializeBody(response.body, response.tags, this.options.deserializer)
              : undefined;
            callback({ response: responseData, isDisposed: true });
          } else {
            callback({
              err: mapToRpcException('query', channel, response.error, this.verboseErrors),
              isDisposed: true,
            });
          }
        })
        .catch((err: unknown) => {
          const e = toError(err);
          callback({
            err: mapErrorToRpcException(e, channel, this.verboseErrors),
            isDisposed: true,
          });
        });
    } else {
      const timeout =
        (metadata?.timeout as number | undefined) ?? this.options.defaultCommandTimeout ?? 10;

      this.client
        .sendCommand(
          {
            channel,
            body: serializedBody,
            timeoutInSeconds: timeout,
            tags,
          },
          { signal: abortController.signal },
        )
        .then((response: CommandResponse) => {
          if (response.executed) {
            const responseData = response.body
              ? deserializeBody(response.body, response.tags, this.options.deserializer)
              : undefined;
            callback({ response: responseData, isDisposed: true });
          } else {
            callback({
              err: mapToRpcException('command', channel, response.error, this.verboseErrors),
              isDisposed: true,
            });
          }
        })
        .catch((err: unknown) => {
          const e = toError(err);
          callback({
            err: mapErrorToRpcException(e, channel, this.verboseErrors),
            isDisposed: true,
          });
        });
    }

    return () => {
      abortController.abort();
    };
  }

  protected async dispatchEvent(packet: ReadPacket): Promise<any> {
    if (!this.client) {
      throw new ConnectionNotReadyError({
        message: 'KubeMQ client is not connected. Call connect() first.',
        operation: 'dispatchEvent',
      });
    }

    const { metadata, data, userTags } = this.extractPacketMetadata(packet);
    const channel =
      typeof packet.pattern === 'string' ? packet.pattern : JSON.stringify(packet.pattern);

    const serializedBody = serializeBody(data, this.options.serializer);
    const baseTags: Record<string, string> = {
      [TAG_PATTERN]: channel,
      [TAG_CONTENT_TYPE]: this.options.serializer?.contentType ?? 'application/json',
    };

    if (metadata?.type === 'queue') {
      baseTags[TAG_TYPE] = 'queue';
      const tags = mergeWireTags(baseTags, userTags);
      const policy = (metadata?.policy ?? this.options.defaultQueuePolicy) as
        | {
            expirationSeconds?: number;
            delaySeconds?: number;
            maxReceiveCount?: number;
            maxReceiveQueue?: string;
          }
        | undefined;

      const result: QueueSendResult = await this.client.sendQueueMessage({
        channel,
        body: serializedBody,
        tags,
        policy: policy
          ? {
              expirationSeconds: policy.expirationSeconds,
              delaySeconds: policy.delaySeconds,
              maxReceiveCount: policy.maxReceiveCount,
              maxReceiveQueue: policy.maxReceiveQueue,
            }
          : undefined,
      });

      return result;
    } else if (metadata?.type === 'event_store') {
      baseTags[TAG_TYPE] = 'event_store';
      const tags = mergeWireTags(baseTags, userTags);

      const result: EventStoreResult = await this.client.sendEventStore({
        channel,
        body: serializedBody,
        tags,
      });

      return result;
    } else {
      baseTags[TAG_TYPE] = 'event';
      const tags = mergeWireTags(baseTags, userTags);

      await this.client.sendEvent({
        channel,
        body: serializedBody,
        tags,
      });
    }
  }

  private extractPacketMetadata(packet: ReadPacket): {
    metadata: Record<string, unknown> | undefined;
    data: unknown;
    userTags?: Record<string, string>;
  } {
    if (isKubeMQRecord(packet.data)) {
      const record = packet.data;
      const type = record.__kubemq_type;
      const meta = record.__kubemq_metadata ?? {};
      const data = record.data;
      const userTags = record.__kubemq_tags;
      if (type) {
        return { metadata: { type, ...meta }, data, userTags };
      }
      return {
        metadata: Object.keys(meta).length > 0 ? meta : undefined,
        data,
        userTags,
      };
    }
    return { metadata: undefined, data: packet.data };
  }
}
