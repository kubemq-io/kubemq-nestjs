/// <reference types="vitest/globals" />
/**
 * Example: Unit Test Handlers
 *
 * Shows how to test @nestjs/cqrs CommandHandler-decorated handlers using
 * NestJS TestingModule with the full DI container — no real KubeMQ broker required.
 *
 * Note: This example uses @nestjs/cqrs @CommandHandler, not the KubeMQ transport
 * @CommandHandler decorator. The same TestingModule pattern applies to both.
 *
 * Run: npx vitest run --config examples/vitest.config.ts testing/unit-test-handlers/unit-test-handlers.spec.ts
 */
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { CqrsModule, CommandBus } from '@nestjs/cqrs';
import { CreateOrderHandler } from './create-order.handler.js';
import { CreateOrderCommand } from './create-order.command.js';

describe('CreateOrderHandler (unit test with TestingModule)', () => {
  let module: TestingModule;
  let handler: CreateOrderHandler;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [CreateOrderHandler],
    }).compile();

    handler = module.get(CreateOrderHandler);
    await module.init();
  });

  afterEach(async () => {
    await module.close();
  });

  it('should create an order successfully', async () => {
    const result = await handler.execute(new CreateOrderCommand('WIDGET-42', 3));

    expect(result).toEqual({
      orderId: 'ORD-WIDGET-42-3',
      status: 'created',
    });
  });

  it('should reject zero quantity', async () => {
    await expect(handler.execute(new CreateOrderCommand('WIDGET-42', 0))).rejects.toThrow(
      'Quantity must be positive',
    );
  });

  it('should reject quantity exceeding maximum', async () => {
    await expect(handler.execute(new CreateOrderCommand('WIDGET-42', 200))).rejects.toThrow(
      'Quantity exceeds maximum of 100',
    );
  });

  it('should be resolvable from DI container', () => {
    const resolved = module.get(CreateOrderHandler);
    expect(resolved).toBeInstanceOf(CreateOrderHandler);
  });
});
