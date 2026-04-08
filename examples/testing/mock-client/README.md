# Mock Client Testing

Shows how to unit test NestJS services that depend on `KubeMQClientProxy` by swapping in `MockKubeMQClient` — no real KubeMQ broker required.

## What This Demonstrates

- Replacing `KubeMQClientProxy` with `MockKubeMQClient` in test DI
- `setResponse()` for pre-configuring mock responses
- `setError()` for simulating broker failures
- `sendCalls` / `emitCalls` for asserting what was sent
- `reset()` for cleaning up between tests

## Run

```bash
npx vitest run --config examples/vitest.config.ts testing/mock-client/mock-client.spec.ts
```

## Key Code

**Setup** — inject mock instead of real client:

```typescript
const mockClient = new MockKubeMQClient();
const module = await Test.createTestingModule({
  providers: [
    OrderService,
    { provide: 'KUBEMQ_SERVICE', useValue: mockClient },
  ],
}).compile();
```

**Assert** — verify recorded calls:

```typescript
mockClient.setResponse('orders.create', { orderId: '123' });
await orderService.createOrder('WIDGET-42', 3);
expect(mockClient.sendCalls[0].pattern).toBe('orders.create');
```
