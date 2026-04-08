# Queue Stream — Delay Policy

Demonstrates sending messages with `delaySeconds` policy via the upstream stream. Messages become visible to consumers only after the delay period expires.

## What This Demonstrates

- `createQueueUpstream()` for persistent upstream stream
- `policy.delaySeconds` on queue messages for delayed visibility
- Polling with `receiveQueueMessages()` after the delay expires

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/delay-policy/main.ts
```

## Expected Output

```
[DelayPolicyExample] Application initialized
[DelayPolicyService] Sending message with 3s delay via upstream...
[DelayPolicyService] Delayed message sent
[DelayPolicyService] Waiting 4s for delay to expire...
[DelayPolicyService] Polling for delayed message...
[DelayPolicyService] Received delayed message: {"task":"delayed-task"}
```

## Key Code

```typescript
const upstream = raw.createQueueUpstream();
await upstream.send([{
  channel: CHANNEL,
  body: JSON.stringify({ task: 'delayed-task' }),
  policy: { delaySeconds: 3 },
}]);
```
