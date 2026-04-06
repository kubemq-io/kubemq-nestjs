import { KubeMQContext } from './kubemq.context.js';

export class KubeMQQueueContext extends KubeMQContext {
  get sequence(): number {
    return this.getArgByIndex(0).sequence as number;
  }

  get receiveCount(): number {
    return this.getArgByIndex(0).receiveCount as number;
  }

  get isReRouted(): boolean {
    return this.getArgByIndex(0).isReRouted as boolean;
  }

  get reRouteFromQueue(): string | undefined {
    return this.getArgByIndex(0).reRouteFromQueue as string | undefined;
  }

  ack(): void {
    const msg = this.getArgByIndex(0)._rawMessage;
    if (!msg || typeof msg.ack !== 'function') {
      throw new Error('ack() is only available in manual ack mode ({ manualAck: true })');
    }
    msg.ack();
  }

  nack(): void {
    const msg = this.getArgByIndex(0)._rawMessage;
    if (!msg || typeof msg.nack !== 'function') {
      throw new Error('nack() is only available in manual ack mode ({ manualAck: true })');
    }
    msg.nack();
  }

  reQueue(channel: string): void {
    const msg = this.getArgByIndex(0)._rawMessage;
    if (!msg || typeof msg.reQueue !== 'function') {
      throw new Error('reQueue() is only available in manual ack mode ({ manualAck: true })');
    }
    msg.reQueue(channel);
  }
}
