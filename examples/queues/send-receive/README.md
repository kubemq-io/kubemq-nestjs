# Queue Send & Receive

Demonstrates sending a queue message via `KubeMQClientProxy` and receiving it with `@QueueHandler`. The handler acknowledges each message via `KubeMQQueueContext.ack()`.

## What This Demonstrates

- `@QueueHandler` decorator with `manualAck: true` for explicit acknowledgment
- `KubeMQRecord.asQueue()` for marking messages as queue type
- `KubeMQQueueContext.ack()` for message acknowledgment
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues/send-receive/main.ts
```

## Expected Output

```
[SendReceiveExample] KubeMQ microservice started
[QueueSenderService] Sending queue message...
[QueueHandlerService] Received on nestjs-queues.send-receive: {"orderId":"ORD-001","item":"Widget"}
[QueueHandlerService] Message acknowledged
[QueueSenderService] Queue message sent successfully
```

## Key Code

**Handler** — receives and acknowledges queue messages:

```typescript
@QueueHandler('nestjs-queues.send-receive', { manualAck: true })
async handleMessage(data: unknown, ctx: KubeMQQueueContext): Promise<void> {
  this.logger.log(`Received on ${ctx.channel}: ${JSON.stringify(data)}`);
  ctx.ack();
}
```

**Service** — sends queue messages via the client proxy:

```typescript
const record = new KubeMQRecord({ orderId: 'ORD-001', item: 'Widget' }).asQueue();
await firstValueFrom(this.client.emit('nestjs-queues.send-receive', record));
```
