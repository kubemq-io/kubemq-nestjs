import { KubeMQQueueContext } from './kubemq-queue.context.js';

interface AckableMessage {
  ack(): void;
  nack(): void;
  reQueue?(channel: string): void;
}

/**
 * Context for batch queue message handlers.
 * Wraps multiple {@link KubeMQQueueContext} instances and provides
 * batch-level ack/nack operations.
 */
export class KubeMQQueueBatchContext {
  constructor(
    private readonly contexts: KubeMQQueueContext[],
    private readonly rawMessages: AckableMessage[],
    private readonly isManualAck: boolean,
  ) {}

  get size(): number {
    return this.contexts.length;
  }

  getContexts(): KubeMQQueueContext[] {
    return this.contexts;
  }

  getContext(index: number): KubeMQQueueContext | undefined {
    return this.contexts[index];
  }

  ackAll(): void {
    if (!this.isManualAck) {
      throw new Error('ackAll() is only available in manual ack mode ({ manualAck: true })');
    }
    for (const msg of this.rawMessages) {
      msg.ack();
    }
  }

  nackAll(): void {
    if (!this.isManualAck) {
      throw new Error('nackAll() is only available in manual ack mode ({ manualAck: true })');
    }
    for (const msg of this.rawMessages) {
      msg.nack();
    }
  }
}
