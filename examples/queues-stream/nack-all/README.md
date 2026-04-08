# Queue Stream — Nack All

Demonstrates receiving messages via `streamQueueMessages()` and rejecting the entire batch using `nackAll()`. Nacked messages are returned to the queue for redelivery.

## What This Demonstrates

- `streamQueueMessages()` for streaming consumption
- `handle.nackAll()` to reject the entire batch
- Redelivery verification via `receiveQueueMessages()` (increased `receiveCount`)

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/nack-all/main.ts
```

## Expected Output

```
[NackAllExample] Application initialized
[NackAllService] Sending 3 messages to queue...
[NackAllService] Stream receive — will NACK all messages...
[NackAllService] Received 3 messages — nacking all
[NackAllService] All messages nacked (returned to queue for redelivery)
[NackAllService] Re-receiving to verify redelivery...
[NackAllService] Redelivered msg seq=1 receiveCount=2
```

## Key Code

```typescript
handle.onMessages((messages) => {
  handle.nackAll();  // return all to queue for redelivery
});
```
