# Start New Only

Demonstrates subscribing to an event store receiving only new events published after the subscription starts. No historical events are replayed.

## What This Demonstrates

- `@EventStoreHandler` with `{ startFrom: 'new' }`
- Skipping all historical events
- Receiving only events published after the subscription is active

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events-store/start-new-only/main.ts
```

## Expected Output

```
[StartNewOnlyExample] Subscribed to event store — new events only (no replay)
[EventStoreHandler] New event (seq=...) on nestjs-events-store.start-new-only: ...
```

## Key Code

```typescript
@EventStoreHandler('nestjs-events-store.start-new-only', {
  startFrom: 'new',
})
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.logger.log(`New event (seq=${ctx.sequence})`);
}
```

Compare with `start-from-first` which replays all history, or `start-from-last` which replays only the most recent event.
