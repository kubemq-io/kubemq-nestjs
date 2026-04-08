# Ack All Queue Messages

Demonstrates receiving and acknowledging all queue messages using `receiveQueueMessages()` from the raw kubemq-js client.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for direct queue operations
- `receiveQueueMessages()` to poll for pending messages
- `msg.ack()` to acknowledge each received message
- Pattern C: service-only (no microservice/handler needed)

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues/ack-all/main.ts
```

## Expected Output

```
[AckAllExample] Application initialized
[AckAllService] Sending 3 messages to queue...
[AckAllService] Receiving and acking all messages...
[AckAllService] Received message seq=1: {"item":1}
[AckAllService] Received message seq=2: {"item":2}
[AckAllService] Received message seq=3: {"item":3}
[AckAllService] All 3 messages received and acknowledged
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();
const messages = await raw.receiveQueueMessages({
  channel: CHANNEL,
  maxMessages: 10,
  waitTimeoutSeconds: 5,
});
for (const msg of messages) {
  await msg.ack();
}
```
