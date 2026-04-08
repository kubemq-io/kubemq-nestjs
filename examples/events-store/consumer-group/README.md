# Consumer Group (Event Store)

Demonstrates load-balanced persistent event delivery using the `group` option on `@EventStoreHandler`. When multiple subscribers share the same consumer group, each stored event is delivered to only one member.

## What This Demonstrates

- `@EventStoreHandler` with `{ group: 'nestjs-es-cg' }` for load-balanced subscriptions
- `KubeMQRecord(data).asEventStore()` for persistent publishing
- `KubeMQEventStoreContext.sequence` for ordered delivery tracking
- Consumer group semantics with event store persistence

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events-store/consumer-group/main.ts
```

## Expected Output

```
[ConsumerGroupExample] Microservice started with event store consumer group
[EventStoreService] Publishing 5 events to store...
[EventStoreHandler] [group=nestjs-es-cg] Event (seq=1) on nestjs-events-store.consumer-group: {"seq":1}
[EventStoreHandler] [group=nestjs-es-cg] Event (seq=2) on nestjs-events-store.consumer-group: {"seq":2}
...
[EventStoreService] All events published to store
```

## Key Code

**Handler** — subscribes with consumer group:

```typescript
@EventStoreHandler('nestjs-events-store.consumer-group', {
  group: 'nestjs-es-cg',
})
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.logger.log(`Event (seq=${ctx.sequence})`);
}
```

**Service** — publishes to event store:

```typescript
await firstValueFrom(
  this.client.emit(channel, new KubeMQRecord({ seq: i }).asEventStore()),
);
```
