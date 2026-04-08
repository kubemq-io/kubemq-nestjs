# Start from Last

Demonstrates subscribing to an event store starting from the most recently stored event. Only the last event and any new events published afterward are received.

## What This Demonstrates

- `@EventStoreHandler` with `{ startFrom: 'last' }`
- Subscribing from the most recent event in the store
- `KubeMQEventStoreContext.sequence` for tracking event position

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events-store/start-from-last/main.ts
```

## Expected Output

```
[StartFromLastExample] Subscribed to event store — starting from last event
[EventStoreHandler] Event (seq=...) on nestjs-events-store.start-from-last: ...
```

## Key Code

```typescript
@EventStoreHandler('nestjs-events-store.start-from-last', {
  startFrom: 'last',
})
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.logger.log(`Event (seq=${ctx.sequence})`);
}
```
