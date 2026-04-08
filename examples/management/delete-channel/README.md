# Delete Channel (Management)

Demonstrates using `client.unwrap()` to access the raw kubemq-js `KubeMQClient` and call `deleteChannel()`. Creates channels, verifies they exist, then deletes them.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for raw SDK access
- `deleteChannel(name, type)` to remove broker channels
- `createChannel()` + `listChannels()` for setup and verification
- Pattern C: No microservice server needed — pure management operation

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/management/delete-channel/main.ts
```

## Expected Output

```
[ManagementService] Created events channel: nestjs-management.delete-channel-events
[ManagementService] Created queues channel: nestjs-management.delete-channel-queues
[ManagementService] Verifying channels exist...
[ManagementService] Found 1 events channel(s)
[ManagementService] Deleted events channel: nestjs-management.delete-channel-events
[ManagementService] Deleted queues channel: nestjs-management.delete-channel-queues
[ManagementService] All channels deleted
[Main] Done
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();

await raw.createChannel('nestjs-management.delete-channel-events', 'events');
await raw.deleteChannel('nestjs-management.delete-channel-events', 'events');
```
