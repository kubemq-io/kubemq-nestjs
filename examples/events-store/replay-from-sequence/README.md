# Replay from Sequence

Demonstrates subscribing to an event store starting from a specific sequence number. All events from the given sequence onward are replayed to the handler.

## What This Demonstrates

- `@EventStoreHandler` with `{ startFrom: 'sequence', startValue: 1 }`
- Replaying historical events from a specific sequence number
- `KubeMQEventStoreContext.sequence` for tracking event order

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Events previously published to `nestjs-events-store.replay-from-sequence`

## Run

```bash
npx tsx examples/events-store/replay-from-sequence/main.ts
```

## Expected Output

```
[ReplayFromSequenceExample] Subscribed to event store from sequence 1
[EventStoreHandler] Replayed event (seq=1) on nestjs-events-store.replay-from-sequence: ...
[EventStoreHandler] Replayed event (seq=2) on nestjs-events-store.replay-from-sequence: ...
```

## Key Code

```typescript
@EventStoreHandler('nestjs-events-store.replay-from-sequence', {
  startFrom: 'sequence',
  startValue: 1,
})
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.logger.log(`Replayed event (seq=${ctx.sequence})`);
}
```
