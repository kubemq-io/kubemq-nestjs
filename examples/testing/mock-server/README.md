# Mock Server Testing

Shows how to test message handlers with `MockKubeMQServer` by dispatching commands, queries, and events directly — no real KubeMQ broker required.

## What This Demonstrates

- `addHandler()` to register handler functions
- `dispatchCommand()` / `dispatchQuery()` to test request/response handlers
- `dispatchEvent()` to test fire-and-forget handlers
- Verifying handler responses and error scenarios
- Testing unregistered patterns

## Run

```bash
npx vitest run --config examples/vitest.config.ts testing/mock-server/mock-server.spec.ts
```

## Key Code

**Register and dispatch**:

```typescript
const server = new MockKubeMQServer();
server.addHandler('orders.create', (data) => handleCreateOrder(data));

const result = await server.dispatchCommand('orders.create', { product: 'WIDGET-42' });
expect(result.executed).toBe(true);
expect(result.response).toMatchObject({ status: 'created' });
```
