# Dead Letter Queue

Demonstrates dead-letter queue routing. A primary handler nacks poison messages, which are automatically routed to a DLQ channel after exceeding `maxReceiveCount`. A second handler processes the dead-lettered messages.

## What This Demonstrates

- `@QueueHandler` on a primary channel with `manualAck: true`
- `@QueueHandler` on a DLQ channel to capture failed messages
- `KubeMQRecord.withMetadata()` for setting DLQ policy (`maxReceiveCount`, `maxReceiveQueue`)
- `ctx.nack()` to reject and trigger dead-letter routing

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues/dead-letter-queue/main.ts
```

## Expected Output

```
[DeadLetterQueueExample] KubeMQ microservice started
[QueueSenderService] Sending poison message with DLQ policy...
[PrimaryHandler] Received poison message — NACK to trigger DLQ
[DLQHandler] Dead-letter received: {"action":"poison","reason":"bad-format"}
[DLQHandler] DLQ message acknowledged
```

## Key Code

**Sender** — sends with DLQ policy:

```typescript
const record = new KubeMQRecord(data)
  .asQueue()
  .withMetadata({
    policy: {
      maxReceiveCount: 1,
      maxReceiveQueue: 'nestjs-queues.dead-letter-queue.dlq',
    },
  });
```

**DLQ Handler** — captures dead-lettered messages:

```typescript
@QueueHandler('nestjs-queues.dead-letter-queue.dlq', { manualAck: true })
async handleDeadLetter(data: unknown, ctx: KubeMQQueueContext): Promise<void> {
  this.logger.log(`Dead-letter received: ${JSON.stringify(data)}`);
  ctx.ack();
}
```
