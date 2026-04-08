# Cancel Subscription

Demonstrates how to cancel an active event subscription by closing the NestJS application after receiving a target number of events.

## What This Demonstrates

- `@EventHandler` decorator for subscribing to events
- Programmatic subscription cancellation via `app.close()`
- Tracking received event count in the handler
- Coordinating handler completion with the bootstrap function

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events/cancel-subscription/main.ts
```

## Expected Output

```
[CancelSubscriptionExample] Microservice started — subscribing to events
[EventHandler] Event 1 received on nestjs-events.cancel-subscription
[EventHandler] Event 2 received on nestjs-events.cancel-subscription
[EventHandler] Event 3 received on nestjs-events.cancel-subscription — target reached
[CancelSubscriptionExample] Handler signalled completion — closing app to cancel subscription
[CancelSubscriptionExample] Subscription cancelled, app closed
```

## Key Code

**Handler** — counts events and signals when target is reached:

```typescript
@EventHandler('nestjs-events.cancel-subscription')
async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
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
