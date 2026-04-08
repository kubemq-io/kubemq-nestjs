# Purge Queue (Management)

Demonstrates using `client.unwrap()` to access the raw kubemq-js `KubeMQClient` and call `purgeQueue()`. Sends messages to a queue channel, then purges all pending messages.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for raw SDK access
- `KubeMQRecord.asQueue()` with `client.emit()` for sending queue messages
- `purgeQueue(channel)` to clear all pending messages
- Pattern C: No microservice server needed — pure management operation

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/management/purge-queue/main.ts
```

## Expected Output

```
[ManagementService] Sent 5 messages to queue
[ManagementService] Queue "nestjs-management.purge-queue" purged successfully
[ManagementService] Cleanup: deleted queue channel
[Main] Done
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();

// Send messages via NestJS client proxy
for (let i = 1; i <= 5; i++) {
  await firstValueFrom(
    this.client.emit(channel, new KubeMQRecord({ seq: i }).asQueue()),
  );
}

// Purge via raw kubemq-js client
await raw.purgeQueue(channel);
```
