# Delayed Queue Messages

Demonstrates sending queue messages with a delay policy via `KubeMQRecord.withMetadata()`. The message becomes visible to consumers only after the specified delay period.

## What This Demonstrates

- `KubeMQRecord.withMetadata({ policy: { delaySeconds: 5 } })` for delayed delivery
- `@QueueHandler` with `manualAck: true` receiving the delayed message
- Policy-based queue message scheduling

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues/delayed-messages/main.ts
```

## Expected Output

```
[DelayedMessagesExample] KubeMQ microservice started
[QueueSenderService] Sending message with 5s delay...
[QueueSenderService] Delayed message sent — will be visible in ~5s
[QueueHandlerService] Received delayed message: {"task":"scheduled-job","scheduledFor":"5s-later"}
[QueueHandlerService] Message acknowledged
```

## Key Code

**Sender** — sends with delay policy:

```typescript
const record = new KubeMQRecord({ task: 'scheduled-job' })
  .asQueue()
  .withMetadata({ policy: { delaySeconds: 5 } });
await firstValueFrom(this.client.emit('nestjs-queues.delayed-messages', record));
```
