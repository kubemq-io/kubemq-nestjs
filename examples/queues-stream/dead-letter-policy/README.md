# Queue Stream — Dead Letter Policy

Demonstrates sending messages with DLQ policy via the upstream stream, then nacking them via stream receive to trigger automatic dead-letter routing.

## What This Demonstrates

- `policy.maxReceiveCount` and `policy.maxReceiveQueue` for DLQ routing
- `createQueueUpstream()` with DLQ policy on messages
- `streamQueueMessages()` + `nackAll()` to reject and trigger DLQ
- `receiveQueueMessages()` to verify messages arrived in the DLQ channel

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/dead-letter-policy/main.ts
```

## Expected Output

```
[DeadLetterPolicyExample] Application initialized
[DeadLetterPolicyService] Sending message with DLQ policy via upstream...
[DeadLetterPolicyService] Nacking message to trigger DLQ routing...
[DeadLetterPolicyService] Nacked — message routed to DLQ channel
[DeadLetterPolicyService] Checking DLQ channel...
[DeadLetterPolicyService] DLQ message: {"poison":"data"}
```

## Key Code

```typescript
await upstream.send([{
  channel: CHANNEL,
  body: JSON.stringify({ poison: 'data' }),
  policy: { maxReceiveCount: 1, maxReceiveQueue: DLQ_CHANNEL },
}]);

// Then nack via stream to trigger DLQ
handle.onMessages(() => { handle.nackAll(); });
```
