# Queue Stream — ReQueue All

Demonstrates receiving messages via `streamQueueMessages()` and re-routing them all to a different channel using `reQueueAll()`.

## What This Demonstrates

- `streamQueueMessages()` for consuming messages
- `handle.reQueueAll(targetChannel)` to re-route entire batch
- Verification via `receiveQueueMessages()` on the target channel

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/requeue-all/main.ts
```

## Expected Output

```
[ReQueueAllExample] Application initialized
[ReQueueAllService] Sending 2 messages to source channel...
[ReQueueAllService] Re-queuing all messages to target channel...
[ReQueueAllService] Messages re-queued to nestjs-queues-stream.requeue-all.target
[ReQueueAllService] Verifying messages on target channel...
[ReQueueAllService] Target msg seq=1: {"item":1}
[ReQueueAllService] Target msg seq=2: {"item":2}
```

## Key Code

```typescript
handle.onMessages(() => {
  handle.reQueueAll('nestjs-queues-stream.requeue-all.target');
});
```
