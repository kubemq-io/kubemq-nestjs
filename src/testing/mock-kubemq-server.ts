import { randomUUID } from 'node:crypto';
import { isObservable, from, of, firstValueFrom, timeout, defaultIfEmpty, EmptyError } from 'rxjs';
import type { Observable } from 'rxjs';
import { KubeMQContext } from '../context/kubemq.context.js';
import { KubeMQRequestContext } from '../context/kubemq-request.context.js';
import { KubeMQEventStoreContext } from '../context/kubemq-event-store.context.js';
import { KubeMQQueueContext } from '../context/kubemq-queue.context.js';
import { KubeMQQueueBatchContext } from '../context/kubemq-queue-batch.context.js';
import { errorMessage } from '../utils/error-helpers.js';

const DEFAULT_HANDLER_MS = 10_000;

/**
 * Convert a handler result to an Observable.
 * Mirrors NestJS Server.transformToObservable() behavior.
 */
function toObservable(value: unknown): Observable<unknown> {
  if (isObservable(value)) return value;
  if (value instanceof Promise) return from(value);
  return of(value);
}

async function executeWithDefault(
  result$: Observable<unknown>,
  timeoutMs: number,
): Promise<unknown> {
  return firstValueFrom(result$.pipe(timeout(timeoutMs), defaultIfEmpty(undefined)));
}

/**
 * In-memory mock of KubeMQServer for unit testing handlers.
 *
 * Allows dispatching messages to registered handlers and
 * capturing handler responses.
 *
 * @example
 * ```typescript
 * import { MockKubeMQServer } from '@kubemq/nestjs-transport/testing';
 *
 * const server = new MockKubeMQServer();
 * server.addHandler('orders.create', myHandler);
 *
 * const result = await server.dispatchCommand('orders.create', { name: 'test' });
 * expect(result.executed).toBe(true);
 * ```
 */
export class MockKubeMQServer {
  private handlers = new Map<string, (...args: unknown[]) => unknown>();

  /** Register a handler for a specific pattern. */
  addHandler(pattern: string, handler: (...args: unknown[]) => unknown): void {
    this.handlers.set(pattern, handler);
  }

  /**
   * Dispatch a command to a registered handler and return the response.
   * Mirrors real Observable execution: handler result is converted to Observable,
   * then resolved via firstValueFrom with a timeout.
   */
  async dispatchCommand(
    pattern: string,
    data: unknown,
  ): Promise<{ executed: boolean; response?: unknown; error?: string }> {
    return this.dispatchRequest(pattern, data, 'command');
  }

  /**
   * Dispatch a query to a registered handler and return the response.
   * Mirrors real Observable execution path.
   */
  async dispatchQuery(
    pattern: string,
    data: unknown,
  ): Promise<{ executed: boolean; response?: unknown; error?: string }> {
    return this.dispatchRequest(pattern, data, 'query');
  }

  private async dispatchRequest(
    pattern: string,
    data: unknown,
    patternType: 'command' | 'query',
  ): Promise<{ executed: boolean; response?: unknown; error?: string }> {
    const handler = this.handlers.get(pattern);
    if (!handler) {
      return { executed: false, error: `No handler for pattern: ${pattern}` };
    }
    try {
      const ctx = new KubeMQRequestContext([
        {
          channel: pattern,
          id: randomUUID(),
          timestamp: new Date(),
          tags: {},
          metadata: '',
          patternType,
          fromClientId: 'mock-client',
          replyChannel: 'mock-reply',
        },
      ]);
      const result$ = toObservable(await handler(data, ctx));
      try {
        const response = await firstValueFrom(result$.pipe(timeout(DEFAULT_HANDLER_MS)));
        return { executed: true, response };
      } catch (err) {
        if (err instanceof EmptyError) {
          return { executed: false, error: 'Handler completed without emitting a response' };
        }
        throw err;
      }
    } catch (err) {
      return { executed: false, error: errorMessage(err) };
    }
  }

  /**
   * Dispatch an event to a registered handler.
   */
  async dispatchEvent(pattern: string, data: unknown): Promise<void> {
    const handler = this.handlers.get(pattern);
    if (!handler) return;
    const ctx = new KubeMQContext([
      {
        channel: pattern,
        id: randomUUID(),
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'event',
      },
    ]);
    const result$ = toObservable(await handler(data, ctx));
    await executeWithDefault(result$, DEFAULT_HANDLER_MS);
  }

  /**
   * Dispatch an event-store message to a registered handler.
   * @param sequence - The sequence number to include in context.
   */
  async dispatchEventStore(pattern: string, data: unknown, sequence = 1): Promise<void> {
    const handler = this.handlers.get(pattern);
    if (!handler) return;
    const ctx = new KubeMQEventStoreContext([
      {
        channel: pattern,
        id: randomUUID(),
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'event_store',
        sequence,
      },
    ]);
    const result$ = toObservable(await handler(data, ctx));
    await executeWithDefault(result$, DEFAULT_HANDLER_MS);
  }

  /**
   * Dispatch a queue message to a registered handler.
   * Returns ack/nack status.
   */
  async dispatchQueueMessage(
    pattern: string,
    data: unknown,
  ): Promise<{ acked: boolean; reQueued?: string }> {
    const handler = this.handlers.get(pattern);
    if (!handler) {
      return { acked: false };
    }

    let acked = false;
    let nacked = false;
    let reQueuedTo: string | undefined;

    const mockMsg = {
      ack: () => {
        acked = true;
      },
      nack: () => {
        nacked = true;
      },
      reQueue: (ch: string) => {
        reQueuedTo = ch;
      },
    };

    const ctx = new KubeMQQueueContext([
      {
        channel: pattern,
        id: randomUUID(),
        timestamp: new Date(),
        tags: {},
        metadata: '',
        patternType: 'queue',
        sequence: 1,
        receiveCount: 1,
        isReRouted: false,
        _rawMessage: mockMsg,
      },
    ]);

    try {
      const result$ = toObservable(await handler(data, ctx));
      await executeWithDefault(result$, DEFAULT_HANDLER_MS);
      if (!acked && !nacked && !reQueuedTo) {
        acked = true; // auto-ack
      }
    } catch {
      if (!acked && !nacked && !reQueuedTo) {
        // eslint-disable-next-line no-useless-assignment
        nacked = true; // auto-nack
      }
    }

    return { acked, reQueued: reQueuedTo };
  }

  /**
   * Dispatch a batch of queue messages to a registered handler.
   * The handler receives an array of payloads and a {@link KubeMQQueueBatchContext}.
   */
  async dispatchQueueBatch(
    pattern: string,
    dataItems: unknown[],
  ): Promise<{ acked: boolean[]; reQueued: Array<string | undefined> }> {
    const handler = this.handlers.get(pattern);
    const acked = dataItems.map(() => false);
    const nacked = dataItems.map(() => false);
    const reQueuedTo: Array<string | undefined> = dataItems.map(() => undefined);

    if (!handler) {
      return { acked, reQueued: reQueuedTo };
    }

    const contexts: KubeMQQueueContext[] = [];
    const mockMsgs: Array<{ ack(): void; nack(): void; reQueue(ch: string): void }> = [];

    for (let i = 0; i < dataItems.length; i++) {
      const idx = i;
      const mockMsg = {
        ack: () => {
          acked[idx] = true;
        },
        nack: () => {
          nacked[idx] = true;
        },
        reQueue: (ch: string) => {
          reQueuedTo[idx] = ch;
        },
      };
      mockMsgs.push(mockMsg);

      contexts.push(
        new KubeMQQueueContext([
          {
            channel: pattern,
            id: randomUUID(),
            timestamp: new Date(),
            tags: {},
            metadata: '',
            patternType: 'queue',
            sequence: idx + 1,
            receiveCount: 1,
            isReRouted: false,
            _rawMessage: mockMsg,
          },
        ]),
      );
    }

    const batchCtx = new KubeMQQueueBatchContext(contexts, mockMsgs, true);

    try {
      const result$ = toObservable(await handler(dataItems, batchCtx));
      await executeWithDefault(result$, DEFAULT_HANDLER_MS);
    } catch {
      /* batch failed */
    }

    return { acked, reQueued: reQueuedTo };
  }

  /** Reset all handlers. */
  reset(): void {
    this.handlers.clear();
  }
}
