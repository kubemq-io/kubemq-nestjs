# Peek Queue Messages

Demonstrates peeking at queue messages without consuming them. Uses `KubeMQClientProxy.unwrap()` to access the underlying kubemq-js client's `peekQueueMessages()` method.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for accessing raw kubemq-js APIs
- `peekQueueMessages()` to inspect messages without removing them from the queue
- Pattern C: service-only (no microservice/handler needed)

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues/peek-messages/main.ts
```

## Expected Output

```
[PeekMessagesExample] Application initialized
[PeekService] Sending 3 messages to queue...
[PeekService] Peeking at queue (messages remain unconsumed)...
[PeekService] Peeked message 1: seq=1 body={"index":0,"info":"peek-test"}
[PeekService] Peeked message 2: seq=2 body={"index":1,"info":"peek-test"}
[PeekService] Peeked message 3: seq=3 body={"index":2,"info":"peek-test"}
[PeekService] Peek complete — messages are still in the queue
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();
const peeked = await raw.peekQueueMessages({
  channel: CHANNEL,
  maxMessages: 10,
  waitTimeoutSeconds: 5,
});
```
