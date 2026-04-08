# Manual Ack

Demonstrates `@QueueHandler` with `{ manualAck: true }` and explicit `ctx.ack()`, `ctx.nack()`, and `ctx.reQueue()` for fine-grained message acknowledgement.

## What This Demonstrates

- `@QueueHandler(channel, { manualAck: true })` — disables auto-ack
- `ctx.ack()` — acknowledge and remove message from queue
- `ctx.nack()` — reject message (returns to queue or dead-letter)
- `ctx.reQueue(channel)` — move message to a different queue for retry
- Business logic branching based on message content

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/decorators/manual-ack/main.ts
```

## Expected Output

```
[ManualAckExample] KubeMQ microservice started — manual ack mode
[SenderService] Sending task T-001 (type=valid)...
[ManualAckHandler] Received task T-001 (type=valid, priority=1) on nestjs-decorators.manual-ack
[ManualAckHandler] Task T-001 — ACK (processed successfully)
[SenderService] Sending task T-002 (type=invalid)...
[ManualAckHandler] Received task T-002 (type=invalid, priority=2) on nestjs-decorators.manual-ack
[ManualAckHandler] Task T-002 — NACK (rejected)
[SenderService] Sending task T-003 (type=retry)...
[ManualAckHandler] Received task T-003 (type=retry, priority=3) on nestjs-decorators.manual-ack
[ManualAckHandler] Task T-003 — REQUEUE to nestjs-decorators.manual-ack-retry
[SenderService] All tasks sent
```

## Key Code

**Handler with manual ack/nack/reQueue:**

```typescript
@QueueHandler('nestjs-decorators.manual-ack', { manualAck: true })
async handleTask(data: TaskMessage, ctx: KubeMQQueueContext): Promise<void> {
  if (data.type === 'valid') {
    ctx.ack();     // processed — remove from queue
  } else if (data.type === 'retry') {
    ctx.reQueue('retry-queue');  // move to retry queue
  } else {
    ctx.nack();    // reject — return to queue
  }
}
```
