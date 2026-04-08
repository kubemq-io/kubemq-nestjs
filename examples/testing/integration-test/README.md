# Integration Test

Shows how to use `KubeMQModule.forTest()` for integration testing with `MockKubeMQClient` and `MockKubeMQServer` injected automatically — no real KubeMQ broker required.

## What This Demonstrates

- `KubeMQModule.forTest()` providing both mock client and mock server via DI
- Testing services with the full NestJS `TestingModule`
- Mocking multiple patterns independently
- Verifying both `send` and `emit` flows
- Combining client mocking and server handler dispatching

## Run

```bash
npx vitest run --config examples/vitest.config.ts testing/integration-test/integration-test.spec.ts
```

## Key Code

**Setup** — `forTest()` wires both mocks:

```typescript
const module = await Test.createTestingModule({
  imports: [KubeMQModule.forTest({ name: 'KUBEMQ_SERVICE' })],
  providers: [OrderService],
}).compile();

const mockClient = module.get(MockKubeMQClient);
const mockServer = module.get(MockKubeMQServer);
```

**Test** — mock and verify:

```typescript
mockClient.setResponse('orders.create', { orderId: 'ORD-001' });
const result = await orderService.createOrder('WIDGET-42', 5);
expect(result).toEqual({ orderId: 'ORD-001' });
expect(mockClient.sendCalls).toHaveLength(1);
```
