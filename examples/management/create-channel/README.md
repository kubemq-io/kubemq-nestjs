# Create Channel (Management)

Demonstrates using `client.unwrap()` to access the raw kubemq-js `KubeMQClient` and call `createChannel()` for all five channel types.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for raw SDK access
- `createChannel(name, type)` for events, events_store, queues, commands, queries
- `deleteChannel(name, type)` for cleanup
- Pattern C: No microservice server needed — pure management operation

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/management/create-channel/main.ts
```

## Expected Output

```
[ManagementService] Created events channel: nestjs-management.create-channel-events
[ManagementService] Created events_store channel: nestjs-management.create-channel-events-store
[ManagementService] Created queues channel: nestjs-management.create-channel-queues
[ManagementService] Created commands channel: nestjs-management.create-channel-commands
[ManagementService] Created queries channel: nestjs-management.create-channel-queries
[ManagementService] All channels created
[ManagementService] Cleanup: deleted all created channels
[Main] Done
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();

await raw.createChannel('nestjs-management.create-channel-events', 'events');
await raw.createChannel('nestjs-management.create-channel-queues', 'queues');
```
