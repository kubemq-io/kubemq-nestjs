# forTest

Demonstrates `KubeMQModule.forTest()` for unit testing without a live KubeMQ broker, using `MockKubeMQClient` and `MockKubeMQServer`.

## What This Demonstrates

- `KubeMQModule.forTest()` — provides in-memory mock client and server
- `MockKubeMQClient` — records `send()`/`emit()` calls, returns pre-configured responses
- `MockKubeMQServer` — dispatches messages to registered handlers
- `mockClient.setResponse()` — configures mock return values
- `mockClient.reset()` — clears recorded calls and responses between tests

## Prerequisites

- None — runs entirely in-memory, no broker needed

## Run

```bash
npx tsx examples/module-config/for-test/main.ts
```

## Expected Output

```
[ForTestExample] Building test module with KubeMQModule.forTest()...
[ForTestExample] Test module compiled — no broker connection needed
[OrderService] Creating order ORD-001...
[ForTestExample] Mock response received: {"orderId":"ORD-001","status":"created","total":49.99}
[ForTestExample] send() calls recorded: 1
[ForTestExample] Pattern used: orders.create
[OrderService] Publishing event: orders.shipped
[ForTestExample] emit() calls recorded: 1
[ForTestExample] MockServer handler result: {"executed":true,"response":{"valid":true,"data":{"orderId":"ORD-002"}}}
[ForTestExample] After reset — send calls: 0
[ForTestExample] Test module closed
```

## Key Code

**Test setup** — no broker connection:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [KubeMQModule.forTest()],
  providers: [OrderService],
}).compile();

const mockClient = moduleRef.get(MockKubeMQClient);
mockClient.setResponse('orders.create', { orderId: 'ORD-001', status: 'created' });
```

**Assertions** — verify recorded calls:

```typescript
console.log(mockClient.sendCalls.length); // 1
console.log(mockClient.sendCalls[0].pattern); // 'orders.create'
```
