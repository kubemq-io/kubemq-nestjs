# Start from First

Demonstrates subscribing to an event store starting from the very first event ever published to the channel. All historical events are replayed before the handler begins receiving new ones.

## What This Demonstrates

- `@EventStoreHandler` with `{ startFrom: 'first' }`
- Full replay of all historical events from the beginning
- `KubeMQEventStoreContext.sequence` for ordered delivery

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events-store/start-from-first/main.ts
```

## Expected Output

```
[StartFromFirstExample] Subscribed to event store — starting from first event
[EventStoreHandler] Event (seq=1) on nestjs-events-store.start-from-first: ...
[EventStoreHandler] Event (seq=2) on nestjs-events-store.start-from-first: ...
```

## Key Code

```typescript
@EventStoreHandler('nestjs-events-store.start-from-first', {
  startFrom: 'first',
})
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.logger.log(`Event (seq=${ctx.sequence})`);
}
```
