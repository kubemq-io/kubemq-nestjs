# Queue Stream — Expiration Policy

Demonstrates sending messages with `expirationSeconds` policy. Messages not consumed within the expiration window are automatically discarded by the broker.

## What This Demonstrates

- `policy.expirationSeconds` for time-to-live on queue messages
- Immediate consumption before expiry (success case)
- Delayed consumption after expiry (message discarded)
- `createQueueUpstream()` for sending with policy

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/expiration-policy/main.ts
```

## Expected Output

```
[ExpirationPolicyExample] Application initialized
[ExpirationPolicyService] Sending message with 3s expiration via upstream...
[ExpirationPolicyService] Consuming immediately (should succeed)...
[ExpirationPolicyService] Received before expiry: {"data":"time-sensitive"}
[ExpirationPolicyService] Sending another message with 2s expiration...
[ExpirationPolicyService] Waiting 3s for expiration...
[ExpirationPolicyService] Polling for expired message — expecting 0 results...
[ExpirationPolicyService] Messages received: 0 (expired as expected)
```

## Key Code

```typescript
await upstream.send([{
  channel: CHANNEL,
  body: JSON.stringify({ data: 'time-sensitive' }),
  policy: { expirationSeconds: 3 },
}]);
```
