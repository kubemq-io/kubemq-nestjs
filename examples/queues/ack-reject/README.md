# Queue Ack & Reject

Demonstrates selective acknowledgment and rejection of queue messages using `ctx.ack()` and `ctx.nack()`.

## What This Demonstrates

- `@QueueHandler` with `manualAck: true` for explicit message control
- `KubeMQQueueContext.ack()` to acknowledge valid messages
- `KubeMQQueueContext.nack()` to reject invalid messages
- Conditional processing logic in a queue handler

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues/ack-reject/main.ts
```

## Expected Output

```
[AckRejectExample] KubeMQ microservice started
[QueueSenderService] Sending valid message...
[QueueSenderService] Sending invalid message...
[QueueHandlerService] Received: {"status":"valid","data":"process-me"} — ACK
[QueueHandlerService] Received: {"status":"invalid","data":"bad-data"} — NACK (rejected)
```

## Key Code

**Handler** — selectively acks or nacks based on message content:

```typescript
@QueueHandler('nestjs-queues.ack-reject', { manualAck: true })
async handleMessage(data: OrderMessage, ctx: KubeMQQueueContext): Promise<void> {
  if (data.status === 'valid') {
    ctx.ack();
  } else {
    ctx.nack();
  }
}
```
