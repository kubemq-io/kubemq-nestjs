import { describe, it, expect, vi } from 'vitest';
import { ScopedKubeMQClientProxy } from '../../../src/client/scoped-kubemq-client.proxy.js';
import { of } from 'rxjs';

function createMockSharedClient() {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    send: vi.fn().mockReturnValue(of('mock-response')),
    emit: vi.fn().mockReturnValue(of(undefined)),
    publish: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('ScopedKubeMQClientProxy', () => {
  // FF-1: forFeature provides ScopedKubeMQClientProxy with channelPrefix
  it('applies channel prefix to send patterns', () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'billing.');

    scoped.send('invoices.create', { amount: 100 });
    expect(shared.send).toHaveBeenCalledWith('billing.invoices.create', { amount: 100 });
  });

  // FF-2: channelPrefix prepended to emit channels
  it('applies channel prefix to emit patterns', () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'payments.');

    scoped.emit('processed', { id: 'p-1' });
    expect(shared.emit).toHaveBeenCalledWith('payments.processed', { id: 'p-1' });
  });

  // FF-3: forFeature delegates to shared SDK client (no second connection)
  it('delegates connect to shared client', async () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'prefix.');

    await scoped.connect();
    expect(shared.connect).toHaveBeenCalledTimes(1);
  });

  it('close is a no-op (shared client lifecycle)', async () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'prefix.');

    await scoped.close();
    expect(shared.close).not.toHaveBeenCalled();
  });

  it('works without prefix (identity)', () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, '');

    scoped.send('orders.get', {});
    expect(shared.send).toHaveBeenCalledWith('orders.get', {});
  });

  it('publish forwards to shared client with prefixed pattern', () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'billing.');
    const callback = vi.fn();
    const packet = { pattern: 'invoices.create', data: { amount: 50 } };

    (scoped as any).publish(packet, callback);

    expect(shared.publish).toHaveBeenCalledWith(
      expect.objectContaining({ pattern: 'billing.invoices.create' }),
      callback,
    );
  });

  it('dispatchEvent forwards to shared client with prefixed pattern', async () => {
    const shared = createMockSharedClient();
    shared.dispatchEvent.mockResolvedValue(undefined);
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'events.');
    const packet = { pattern: 'order.placed', data: { id: 'o-1' } };

    await (scoped as any).dispatchEvent(packet);

    expect(shared.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ pattern: 'events.order.placed' }),
    );
  });

  it('unwrap delegates to shared client', () => {
    const shared = createMockSharedClient();
    const unwrapResult = { underlying: true };
    (shared as any).unwrap = vi.fn().mockReturnValue(unwrapResult);
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'prefix.');

    const result = (scoped as any).unwrap();
    expect((shared as any).unwrap).toHaveBeenCalled();
    expect(result).toBe(unwrapResult);
  });

  it('applyPrefix with object pattern returns unchanged', () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, 'billing.');
    const objPattern = { cmd: 'create', version: 2 };

    scoped.send(objPattern as any, {});
    expect(shared.send).toHaveBeenCalledWith(objPattern, {});
  });

  it('applyPrefix with empty prefix returns original string', () => {
    const shared = createMockSharedClient();
    const scoped = new ScopedKubeMQClientProxy(shared as any, '');

    scoped.send('raw.pattern', {});
    expect(shared.send).toHaveBeenCalledWith('raw.pattern', {});
  });
});
