/// <reference types="vitest/globals" />
/**
 * Example: Integration Test with KubeMQModule.forTest()
 *
 * Shows how to use KubeMQModule.forTest() for integration testing with
 * MockKubeMQClient and MockKubeMQServer injected automatically — no broker required.
 *
 * Run: npx vitest run --config examples/vitest.config.ts testing/integration-test/integration-test.spec.ts
 */
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { MockKubeMQClient, MockKubeMQServer } from '@kubemq/nestjs-transport/testing';
import { OrderService } from './order.service.js';

describe('Integration Test with KubeMQModule.forTest()', () => {
  let module: TestingModule;
  let orderService: OrderService;
  let mockClient: MockKubeMQClient;
  let mockServer: MockKubeMQServer;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [KubeMQModule.forTest({ name: 'KUBEMQ_SERVICE' })],
      providers: [OrderService],
    }).compile();

    orderService = module.get(OrderService);
    const client = module.get('KUBEMQ_SERVICE');
    mockClient = client as MockKubeMQClient;
    mockServer = new MockKubeMQServer();
  });

  afterEach(async () => {
    mockClient.reset();
    mockServer.reset();
    await module.close();
  });

  it('should provide mock client via DI', () => {
    expect(mockClient).toBeDefined();
    expect(typeof mockClient.send).toBe('function');
    expect(typeof mockClient.emit).toBe('function');
  });

  it('should provide mock server', () => {
    expect(mockServer).toBeDefined();
    expect(typeof mockServer.addHandler).toBe('function');
  });

  it('should mock client send and verify service flow', async () => {
    mockClient.setResponse('nestjs-testing.orders.create', { orderId: 'ORD-TEST-001' });

    const result = await orderService.createOrder('WIDGET-42', 5);

    expect(result).toEqual({ orderId: 'ORD-TEST-001' });
    expect(mockClient.sendCalls).toHaveLength(1);
    expect(mockClient.sendCalls[0].data).toEqual({ product: 'WIDGET-42', quantity: 5 });
  });

  it('should mock multiple patterns independently', async () => {
    mockClient.setResponse('nestjs-testing.orders.create', { orderId: 'ORD-001' });
    mockClient.setResponse('nestjs-testing.orders.get', {
      orderId: 'ORD-001',
      status: 'shipped',
    });

    const created = await orderService.createOrder('WIDGET-42', 1);
    const fetched = await orderService.getOrder('ORD-001');

    expect(created).toEqual({ orderId: 'ORD-001' });
    expect(fetched).toEqual({ orderId: 'ORD-001', status: 'shipped' });
  });

  it('should track emit calls separately from send calls', async () => {
    await orderService.emitEvent('nestjs-testing.orders.audit', { action: 'created' });

    expect(mockClient.emitCalls).toHaveLength(1);
    expect(mockClient.sendCalls).toHaveLength(0);
    expect(mockClient.emitCalls[0].data).toEqual({ action: 'created' });
  });

  it('should test server handler dispatching', async () => {
    const received: unknown[] = [];
    mockServer.addHandler('nestjs-testing.orders.process', (data: unknown) => {
      received.push(data);
      return { processed: true };
    });

    const result = await mockServer.dispatchCommand('nestjs-testing.orders.process', {
      orderId: 'ORD-001',
    });

    expect(result.executed).toBe(true);
    expect(result.response).toEqual({ processed: true });
    expect(received).toHaveLength(1);
  });
});
