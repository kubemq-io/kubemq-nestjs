# Cancel Subscription (Event Store)

Demonstrates how to cancel an active event store subscription by closing the NestJS application after receiving a target number of persistent events.

## What This Demonstrates

- `@EventStoreHandler` decorator for persistent event subscription
- Programmatic subscription cancellation via `app.close()`
- Tracking received event count with sequence numbers
- Coordinating handler completion with the bootstrap function
- `KubeMQRecord(data).asEventStore()` for publishing to the store

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events-store/cancel-subscription/main.ts
```

## Expected Output

```
[CancelSubscriptionExample] Microservice started — subscribing to event store
[EventStoreHandler] Event 1 (seq=1) received on nestjs-events-store.cancel-subscription
[EventStoreHandler] Event 2 (seq=2) received on nestjs-events-store.cancel-subscription
[EventStoreHandler] Event 3 (seq=3) received — target reached
[CancelSubscriptionExample] Handler signalled completion — closing app to cancel subscription
[CancelSubscriptionExample] Event store subscription cancelled, app closed
```

## Key Code

**Handler** — counts events and signals when target is reached:

```typescript
@EventStoreHandler('nestjs-events-store.cancel-subscription')
async handleEvent(data: unknown, ctx: KubeMQEventStoreContext): Promise<void> {
  this.count++;
  if (this.count >= 3) {
    this.resolveComplete();
  }
}
```

**Main** — awaits handler completion, then closes app:

```typescript
await handler.complete;
await app.close();
```
