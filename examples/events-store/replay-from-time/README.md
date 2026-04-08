# Replay from Time Delta

Demonstrates subscribing to an event store starting from a time offset. The handler replays all events published within the last 30 seconds.

## What This Demonstrates

- `@EventStoreHandler` with `{ startFrom: 'timeDelta', startValue: 30 }`
- Time-based replay of historical events
- `KubeMQEventStoreContext.sequence` for tracking replayed event order

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Events recently published to `nestjs-events-store.replay-from-time` (within 30 seconds)

## Run

```bash
npx tsx examples/events-store/replay-from-time/main.ts
```

## Expected Output

```
[ReplayFromTimeExample] Subscribed to event store — replaying last 30 seconds
[EventStoreHandler] Replayed event (seq=...) on nestjs-events-store.replay-from-time: ...
```

## Key Code

```typescript
@EventStoreHandler('nestjs-events-store.replay-from-time', {
  startFrom: 'timeDelta',
  startValue: 30,
})
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.logger.log(`Replayed event (seq=${ctx.sequence})`);
}
```

The `startValue: 30` means "replay events from 30 seconds ago." Adjust the value to control the replay window.
