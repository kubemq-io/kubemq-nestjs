# Queue Stream — Streaming Receive

Demonstrates streaming queue consumption via `streamQueueMessages()`. Messages are received in batches with explicit `ackAll()` acknowledgment.

## What This Demonstrates

- `streamQueueMessages()` for streaming queue consumption
- `handle.onMessages()` callback for batch message processing
- `handle.ackAll()` for batch acknowledgment
- `handle.onError()` and `handle.onClose()` for lifecycle handling

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/stream-receive/main.ts
```

## Expected Output

```
[StreamReceiveExample] Application initialized
[StreamReceiveService] Sending 3 messages to queue...
[StreamReceiveService] Starting stream consumer...
[StreamReceiveService] Stream batch received (3 messages):
[StreamReceiveService]   msg seq=1: {"index":1}
[StreamReceiveService]   msg seq=2: {"index":2}
[StreamReceiveService]   msg seq=3: {"index":3}
[StreamReceiveService] Acked all messages
```

## Key Code

```typescript
const handle = raw.streamQueueMessages({
  channel: CHANNEL,
  maxMessages: 10,
  waitTimeoutSeconds: 5,
});
handle.onMessages((messages) => {
  for (const msg of messages) { /* process */ }
  handle.ackAll();
});
```
