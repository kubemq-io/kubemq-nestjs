/// <reference types="vitest/globals" />
/**
 * Example: MockKubeMQServer
 *
 * Shows how to test message handlers with MockKubeMQServer by dispatching
 * commands, queries, and events directly — no real KubeMQ broker required.
 *
 * Run: npx vitest run --config examples/vitest.config.ts testing/mock-server/mock-server.spec.ts
 */
import { MockKubeMQServer } from '@kubemq/nestjs-transport/testing';
import { handleCreateOrder, handleOrderNotification } from './order.handler.js';

describe('MockKubeMQServer', () => {
  let server: MockKubeMQServer;

  beforeEach(() => {
    server = new MockKubeMQServer();
  });

  afterEach(() => {
    server.reset();
  });

  it('should dispatch a command and return handler response', async () => {
    server.addHandler('nestjs-testing.orders.create', (data: unknown) =>
      handleCreateOrder(data as { product: string; quantity: number }),
    );

    const result = await server.dispatchCommand('nestjs-testing.orders.create', {
      product: 'WIDGET-42',
      quantity: 3,
    });

    expect(result.executed).toBe(true);
    expect(result.response).toMatchObject({
      product: 'WIDGET-42',
      status: 'created',
    });
  });

  it('should dispatch a query and return handler response', async () => {
    server.addHandler('nestjs-testing.orders.get', () => ({
      orderId: 'ORD-001',
      product: 'WIDGET-42',
      status: 'shipped',
    }));

    const result = await server.dispatchQuery('nestjs-testing.orders.get', {
      orderId: 'ORD-001',
    });

    expect(result.executed).toBe(true);
    expect(result.response).toEqual({
      orderId: 'ORD-001',
      product: 'WIDGET-42',
      status: 'shipped',
    });
  });

  it('should dispatch an event to a handler', async () => {
    const received: unknown[] = [];
    server.addHandler('nestjs-testing.orders.notify', (data: unknown) => {
      received.push(data);
    });

    await server.dispatchEvent('nestjs-testing.orders.notify', {
      orderId: 'ORD-001',
      message: 'Order shipped',
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({ orderId: 'ORD-001', message: 'Order shipped' });
  });

  it('should report error for unregistered pattern', async () => {
    const result = await server.dispatchCommand('nestjs-testing.unknown', {});
    expect(result.executed).toBe(false);
    expect(result.error).toContain('No handler');
  });

  it('should report error when handler throws', async () => {
    server.addHandler('nestjs-testing.orders.fail', () => {
      throw new Error('Validation failed');
    });

    const result = await server.dispatchCommand('nestjs-testing.orders.fail', {});
    expect(result.executed).toBe(false);
    expect(result.error).toContain('Validation failed');
  });
});
