# Queue Stream — High-Throughput Send

Demonstrates high-throughput queue sending via `createQueueUpstream()`, which keeps a persistent gRPC bidirectional stream open for reduced per-message overhead.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for accessing raw stream APIs
- `createQueueUpstream()` for persistent upstream stream
- `upstream.send()` for batch message sending
- Upstream lifecycle management (`close()`)

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/stream-send/main.ts
```

## Expected Output

```
[StreamSendExample] Application initialized
[StreamSendService] Creating upstream stream...
[StreamSendService] Sending batch 1 (3 messages)...
[StreamSendService] Batch 1 sent — results: 3
[StreamSendService] Sending batch 2 (3 messages)...
[StreamSendService] Batch 2 sent — results: 3
[StreamSendService] Upstream stream closed
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();
const upstream = raw.createQueueUpstream();
const result = await upstream.send([
  { channel: CHANNEL, body: JSON.stringify({ item: 1 }) },
]);
upstream.close();
```
