# Wildcard Subscription

Demonstrates subscribing to events using a wildcard channel pattern. A single handler receives events from any channel matching `nestjs-events.wildcard.*`.

## What This Demonstrates

- `@EventHandler('nestjs-events.wildcard.*')` with wildcard pattern
- Receiving events from multiple sub-channels with a single handler
- `KubeMQContext.channel` to identify which specific channel the event came from
- Publishing to specific sub-channels that match the wildcard

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events/wildcard-subscription/main.ts
```

## Expected Output

```
[WildcardSubscriptionExample] Microservice started with wildcard handler
[EventService] Publishing to nestjs-events.wildcard.orders...
[EventService] Publishing to nestjs-events.wildcard.users...
[EventService] Publishing to nestjs-events.wildcard.payments...
[EventHandler] Wildcard match on nestjs-events.wildcard.orders: {"type":"order","id":1}
[EventHandler] Wildcard match on nestjs-events.wildcard.users: {"type":"user","id":2}
[EventHandler] Wildcard match on nestjs-events.wildcard.payments: {"type":"payment","id":3}
```

## Key Code

**Handler** — uses wildcard pattern to match multiple channels:

```typescript
@EventHandler('nestjs-events.wildcard.*')
async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
  this.logger.log(`Wildcard match on ${ctx.channel}: ${JSON.stringify(data)}`);
}
```

**Service** — publishes to specific sub-channels:

```typescript
await firstValueFrom(this.client.emit('nestjs-events.wildcard.orders', data));
await firstValueFrom(this.client.emit('nestjs-events.wildcard.users', data));
```
