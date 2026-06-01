import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';
import type { KubeMQClientProxy } from './kubemq-client.proxy.js';
import { Observable } from 'rxjs';

export class ScopedKubeMQClientProxy extends ClientProxy {
  constructor(
    private readonly sharedClient: KubeMQClientProxy,
    private readonly channelPrefix: string = '',
  ) {
    super();
  }

  async connect(): Promise<void> {
    return this.sharedClient.connect();
  }

  async close(): Promise<void> {
    // no-op: shared client lifecycle managed by forRoot
  }

  send(pattern: any, data: any): Observable<any> {
    const prefixed = this.applyPrefix(pattern);
    return this.sharedClient.send(prefixed, data);
  }

  emit(pattern: any, data: any): Observable<any> {
    return this.sharedClient.emit(this.applyPrefix(pattern), data);
  }

  protected publish(packet: ReadPacket, callback: (packet: WritePacket) => void): () => void {
    const prefixed = { ...packet, pattern: this.applyPrefix(packet.pattern) };
    return (this.sharedClient as any).publish(prefixed, callback);
  }

  protected async dispatchEvent(packet: ReadPacket): Promise<any> {
    const prefixed = { ...packet, pattern: this.applyPrefix(packet.pattern) };
    return (this.sharedClient as any).dispatchEvent(prefixed);
  }

  unwrap(): any {
    return this.sharedClient.unwrap();
  }

  private applyPrefix(pattern: any): any {
    if (!this.channelPrefix) return pattern;
    if (typeof pattern === 'string') return this.channelPrefix + pattern;
    return pattern;
  }
}
