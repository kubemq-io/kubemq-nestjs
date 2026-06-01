import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export interface CorrelationStore {
  correlationId: string;
  causationId: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

export class CorrelationContext {
  static run<T>(store: CorrelationStore, fn: () => T): T {
    return storage.run(store, fn);
  }

  static get(): CorrelationStore | undefined {
    return storage.getStore();
  }

  static getCorrelationId(): string | undefined {
    return storage.getStore()?.correlationId;
  }

  static getCausationId(): string | undefined {
    return storage.getStore()?.causationId;
  }

  static createFromTags(
    tags: Record<string, string> | undefined,
    messageId: string,
    correlationIdTag: string,
    _causationIdTag: string,
  ): CorrelationStore {
    const correlationId = tags?.[correlationIdTag] ?? randomUUID();
    const causationId = messageId;
    return { correlationId, causationId };
  }
}
