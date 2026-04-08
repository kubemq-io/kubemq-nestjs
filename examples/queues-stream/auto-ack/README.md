# Queue Stream — Auto Ack

Demonstrates `streamQueueMessages()` with `autoAck: true`. Messages are automatically acknowledged upon delivery — no manual `ackAll()` call needed.

## What This Demonstrates

- `streamQueueMessages()` with `autoAck: true` for automatic acknowledgment
- Simplified consumer pattern without manual settlement
- Suitable for fire-and-forget queue consumption

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/auto-ack/main.ts
```

## Expected Output

```
[AutoAckExample] Application initialized
[AutoAckService] Sending 3 messages to queue...
[AutoAckService] Starting stream consumer with autoAck: true...
[AutoAckService] Auto-acked message seq=1: {"index":1}
[AutoAckService] Auto-acked message seq=2: {"index":2}
[AutoAckService] Auto-acked message seq=3: {"index":3}
[AutoAckService] All messages auto-acknowledged — no manual ack needed
```

## Key Code

```typescript
const handle = raw.streamQueueMessages({
  channel: CHANNEL,
  maxMessages: 10,
  waitTimeoutSeconds: 5,
  autoAck: true,  // messages auto-acked on receipt
});
handle.onMessages((messages) => {
  // process messages — already acknowledged
});
```
