/**
 * Example: forTest (Module Config)
 *
 * Demonstrates KubeMQModule.forTest() for unit testing without a live broker.
 * Uses MockKubeMQClient and MockKubeMQServer from '@kubemq/nestjs-transport/testing'
 * to verify service behavior in isolation.
 *
 * Prerequisites:
 *   - None (no broker needed — runs entirely in-memory)
 *
 * Run: npx tsx examples/module-config/for-test/main.ts
 */
import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { MockKubeMQClient, MockKubeMQServer } from '@kubemq/nestjs-transport/testing';
import { OrderService } from './order.service.js';

const logger = new Logger('ForTestExample');

async function main(): Promise<void> {
  logger.log('Building test module with KubeMQModule.forTest()...');

  const moduleRef = await Test.createTestingModule({
    imports: [KubeMQModule.forTest()],
    providers: [OrderService],
  }).compile();

  const orderService = moduleRef.get(OrderService);
  const mockClient = moduleRef.get(MockKubeMQClient);
  const mockServer = moduleRef.get(MockKubeMQServer);

  logger.log('Test module compiled — no broker connection needed');

  mockClient.setResponse('orders.create', {
    orderId: 'ORD-001',
    status: 'created',
    total: 49.99,
  });

  const result = await orderService.createOrder('ORD-001', 'Widget');
  logger.log(`Mock response received: ${JSON.stringify(result)}`);

  logger.log(`send() calls recorded: ${mockClient.sendCalls.length}`);
  logger.log(`Pattern used: ${mockClient.sendCalls[0]?.pattern}`);

  await orderService.publishEvent('orders.shipped', { orderId: 'ORD-001' });
  logger.log(`emit() calls recorded: ${mockClient.emitCalls.length}`);

  mockServer.addHandler('orders.validate', (data: unknown) => {
    return { valid: true, data };
  });
  const validateResult = await mockServer.dispatchCommand('orders.validate', {
    orderId: 'ORD-002',
  });
  logger.log(`MockServer handler result: ${JSON.stringify(validateResult)}`);

  mockClient.reset();
  logger.log(`After reset — send calls: ${mockClient.sendCalls.length}`);

  await moduleRef.close();
  logger.log('Test module closed');
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [ForTestExample] Building test module with KubeMQModule.forTest()...
// [ForTestExample] Test module compiled — no broker connection needed
// [OrderService] Creating order ORD-001...
// [ForTestExample] Mock response received: {"orderId":"ORD-001","status":"created","total":49.99}
// [ForTestExample] send() calls recorded: 1
// [ForTestExample] Pattern used: orders.create
// [OrderService] Publishing event: orders.shipped
// [ForTestExample] emit() calls recorded: 1
// [ForTestExample] MockServer handler result: {"executed":true,"response":{"valid":true,"data":{"orderId":"ORD-002"}}}
// [ForTestExample] After reset — send calls: 0
// [ForTestExample] Test module closed
