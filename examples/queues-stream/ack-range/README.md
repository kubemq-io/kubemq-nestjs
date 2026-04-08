# Queue Stream — Ack Range

Demonstrates selectively acknowledging specific messages by their sequence numbers using `ackRange()` on a stream handle.

## What This Demonstrates

- `streamQueueMessages()` for streaming consumption
- `handle.ackRange(sequences)` to ack specific messages by sequence number
- Selective processing within a batch

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/ack-range/main.ts
```

## Expected Output

```
[AckRangeExample] Application initialized
[AckRangeService] Sending 4 messages to queue...
[AckRangeService] Streaming receive — will ack only specific sequences...
[AckRangeService] Received 4 messages, acking sequences: [1, 3]
[AckRangeService] Ack range applied — sequences 1 and 3 acknowledged
```

## Key Code

```typescript
handle.onMessages((messages) => {
  const seqs = messages.filter((_, idx) => idx % 2 === 0).map((m) => m.sequence);
  handle.ackRange(seqs);  // ack only selected messages
});
```
