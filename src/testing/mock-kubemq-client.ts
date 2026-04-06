import { ClientProxy, ReadPacket, WritePacket } from '@nestjs/microservices';

/**
 * In-memory mock of KubeMQClientProxy for unit testing.
 *
 * Extends `ClientProxy` so it can be used as a drop-in replacement
 * in the NestJS DI container.
 *
 * @example
 * ```typescript
 * import { MockKubeMQClient } from '@kubemq/nestjs-transport/testing';
 *
 * const mockClient = new MockKubeMQClient();
 * mockClient.setResponse('orders.create', { orderId: '123' });
 *
 * const module = await Test.createTestingModule({
 *   providers: [
 *     OrderService,
 *     { provide: 'KUBEMQ_SERVICE', useValue: mockClient },
 *   ],
 * }).compile();
 * ```
 */
export class MockKubeMQClient extends ClientProxy {
  /** Recorded send() calls: { pattern, data }[]. */
  readonly sendCalls: Array<{ pattern: string; data: unknown }> = [];

  /** Recorded emit() calls: { pattern, data }[]. */
  readonly emitCalls: Array<{ pattern: string; data: unknown }> = [];

  /** Pre-configured responses keyed by pattern. */
  private responses = new Map<string, unknown>();

  /** Pre-configured errors keyed by pattern. */
  private errors = new Map<string, Error>();

  /**
   * Set the response value for a given pattern.
   * send() calls matching this pattern will emit this value.
   */
  setResponse(pattern: string, response: unknown): void {
    this.responses.set(pattern, response);
  }

  /**
   * Set an error for a given pattern.
   * send() calls matching this pattern will error with this value.
   */
  setError(pattern: string, error: Error): void {
    this.errors.set(pattern, error);
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- required by abstract base class
  unwrap<T>(): T {
    return {} as T;
  }

  /** Connect no-op. */
  connect(): Promise<void> {
    return Promise.resolve();
  }

  /** Close no-op (async for parity with real client). */
  async close(): Promise<void> {
    /* no-op */
  }

  /** @internal Required by ClientProxy — handles send() calls. */
  protected publish(packet: ReadPacket, callback: (packet: WritePacket) => void): () => void {
    const pattern =
      typeof packet.pattern === 'string' ? packet.pattern : JSON.stringify(packet.pattern);
    this.sendCalls.push({ pattern, data: packet.data });
    const error = this.errors.get(pattern);
    if (error) {
      callback({ err: error, isDisposed: true });
    } else {
      callback({ response: this.responses.get(pattern), isDisposed: true });
    }
    return () => {};
  }

  /** @internal Required by ClientProxy — handles emit() calls. */
  protected async dispatchEvent<T = unknown>(packet: ReadPacket): Promise<T> {
    const pattern =
      typeof packet.pattern === 'string' ? packet.pattern : JSON.stringify(packet.pattern);
    this.emitCalls.push({ pattern, data: packet.data });
    return undefined as T;
  }

  /** Reset all recorded calls and configured responses. */
  reset(): void {
    this.sendCalls.length = 0;
    this.emitCalls.length = 0;
    this.responses.clear();
    this.errors.clear();
  }
}
