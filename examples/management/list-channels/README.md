# List Channels (Management)

Demonstrates using `client.unwrap()` to access the raw kubemq-js `KubeMQClient` and call `listChannels()` for each channel type.

## What This Demonstrates

- `KubeMQClientProxy.unwrap<KubeMQClient>()` for raw SDK access
- `listChannels(type, searchPrefix)` to query broker channels
- Pattern C: No microservice server needed — pure management operation
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/management/list-channels/main.ts
```

## Expected Output

```
[ManagementService] [events] Found N channel(s) matching "nestjs-":
[ManagementService]   nestjs-events.basic-pubsub — type: events, active: true
[ManagementService] [events_store] Found N channel(s) matching "nestjs-":
...
[Main] Done
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();

const channels = await raw.listChannels('events', 'nestjs-');
for (const ch of channels) {
  this.logger.log(`${ch.name} — type: ${ch.type}, active: ${ch.isActive}`);
}
```
