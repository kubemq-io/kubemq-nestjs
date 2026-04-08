/// <reference types="vitest/globals" />
/**
 * Example: MockKubeMQClient
 *
 * Shows how to unit test services that use KubeMQClientProxy by replacing
 * it with MockKubeMQClient — no real KubeMQ broker required.
 *
 * Run: npx vitest run --config examples/vitest.config.ts testing/mock-client/mock-client.spec.ts
 */
import { Test } from '@nestjs/testing';
import { MockKubeMQClient } from '@kubemq/nestjs-transport/testing';
import { OrderService } from './order.service.js';

describe('MockKubeMQClient', () => {
  let orderService: OrderService;
  let mockClient: MockKubeMQClient;

  beforeEach(async () => {
    mockClient = new MockKubeMQClient();

    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: 'KUBEMQ_SERVICE', useValue: mockClient },
      ],
    }).compile();

    orderService = module.get(OrderService);
  });

  afterEach(() => {
    mockClient.reset();
  });

  it('should send a command and receive a mocked response', async () => {
    mockClient.setResponse('nestjs-testing.orders.create', { orderId: 'ORD-001' });

    const result = await orderService.createOrder('WIDGET-42', 3);

    expect(result).toEqual({ orderId: 'ORD-001' });
    expect(mockClient.sendCalls).toHaveLength(1);
    expect(mockClient.sendCalls[0]).toEqual({
      pattern: 'nestjs-testing.orders.create',
      data: { product: 'WIDGET-42', quantity: 3 },
    });
  });

  it('should emit an event and record the call', async () => {
    await orderService.notifyOrderShipped('ORD-001');

    expect(mockClient.emitCalls).toHaveLength(1);
    expect(mockClient.emitCalls[0]).toEqual({
      pattern: 'nestjs-testing.orders.shipped',
      data: { orderId: 'ORD-001' },
    });
  });

  it('should simulate an error response', async () => {
    mockClient.setError('nestjs-testing.orders.create', new Error('Broker unavailable'));

    await expect(orderService.createOrder('WIDGET-42', 1)).rejects.toThrow('Broker unavailable');
  });

  it('should reset recorded calls between tests', () => {
    mockClient.setResponse('some.pattern', { ok: true });
    mockClient.reset();

    expect(mockClient.sendCalls).toHaveLength(0);
    expect(mockClient.emitCalls).toHaveLength(0);
  });
});
