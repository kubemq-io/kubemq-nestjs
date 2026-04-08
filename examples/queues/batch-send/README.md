# Batch Send Queue Messages

Demonstrates sending multiple queue messages in a loop using `KubeMQClientProxy.unwrap()` to access the raw kubemq-js `sendQueueMessage()` API.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for direct queue operations
- Sending multiple messages in sequence via `sendQueueMessage()`
- Pattern C: service-only (no microservice/handler needed)

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues/batch-send/main.ts
```

## Expected Output

```
[BatchSendExample] Application initialized
[BatchSendService] Sending 5 queue messages...
[BatchSendService] Sent message 1/5 to nestjs-queues.batch-send
[BatchSendService] Sent message 2/5 to nestjs-queues.batch-send
[BatchSendService] Sent message 3/5 to nestjs-queues.batch-send
[BatchSendService] Sent message 4/5 to nestjs-queues.batch-send
[BatchSendService] Sent message 5/5 to nestjs-queues.batch-send
[BatchSendService] Batch send complete
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();
for (let i = 1; i <= BATCH_SIZE; i++) {
  await raw.sendQueueMessage({
    channel: CHANNEL,
    body: JSON.stringify({ batchItem: i, payload: `item-${i}` }),
  });
}
```
