# Persistent Pub/Sub (Event Store)

Demonstrates persistent event publishing and subscribing using `@EventStoreHandler` and `KubeMQRecord.asEventStore()`. Events are stored durably and assigned sequence numbers.

## What This Demonstrates

- `@EventStoreHandler` decorator for subscribing to persistent events
- `KubeMQRecord(data).asEventStore()` to mark messages for the event store
- `KubeMQEventStoreContext` with `ctx.sequence` for event ordering
- `client.emit()` + `firstValueFrom()` for publishing to the event store

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events-store/persistent-pubsub/main.ts
```

## Expected Output

```
[PersistentPubSubExample] KubeMQ microservice started with event store handler
[EventStoreService] Publishing event to store...
[EventStoreHandler] Received event (seq=1) on nestjs-events-store.persistent-pubsub: {"message":"persistent event"}
[EventStoreService] Event store message published
```

## Key Code

**Handler** — subscribes to persistent events with sequence tracking:

```typescript
@EventStoreHandler('nestjs-events-store.persistent-pubsub')
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.logger.log(`Received event (seq=${ctx.sequence}) on ${ctx.channel}`);
}
```

**Service** — publishes using `KubeMQRecord.asEventStore()`:

```typescript
await firstValueFrom(
  this.client.emit(
    'nestjs-events-store.persistent-pubsub',
    new KubeMQRecord({ message: 'persistent event' }).asEventStore(),
  ),
);
```
