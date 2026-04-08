# Consumer Group Events

Demonstrates load-balanced event delivery using the `group` option on `@EventHandler`. When multiple subscribers share the same consumer group, KubeMQ delivers each event to only one member of the group.

## What This Demonstrates

- `@EventHandler` with `{ group: 'nestjs-events-cg' }` for consumer group subscription
- Load-balanced event delivery across group members
- `KubeMQClientProxy.emit()` for publishing events

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events/consumer-group/main.ts
```

## Expected Output

```
[ConsumerGroupExample] Microservice started with consumer group handler
[EventService] Publishing 5 events to consumer group channel...
[EventHandler] [group=nestjs-events-cg] Event received on nestjs-events.consumer-group: {"seq":1}
[EventHandler] [group=nestjs-events-cg] Event received on nestjs-events.consumer-group: {"seq":2}
...
[EventService] All events published
```

## Key Code

**Handler** — subscribes with a consumer group:

```typescript
@EventHandler('nestjs-events.consumer-group', { group: 'nestjs-events-cg' })
async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
  this.logger.log(`Event received on ${ctx.channel}: ${JSON.stringify(data)}`);
}
```

In a multi-instance deployment, only one instance in the `nestjs-events-cg` group receives each event, enabling horizontal scaling.
