# Multiple Subscribers (Fan-Out)

Demonstrates fan-out event delivery where two separate handler classes subscribe to the same channel without a consumer group. Every published event is delivered to all subscribers.

## What This Demonstrates

- Multiple `@EventHandler` classes on the same channel (no `group` option)
- Fan-out delivery — each event reaches every subscriber
- Pattern D: multi-class fan-out architecture
- Contrast with consumer-group example where only one handler receives each event

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events/multiple-subscribers/main.ts
```

## Expected Output

```
[MultipleSubscribersExample] Microservice started with two subscriber classes
[EventService] Publishing event to fan-out channel...
[SubscriberA] Received event on nestjs-events.multiple-subscribers: {"message":"fan-out test"}
[SubscriberB] Received event on nestjs-events.multiple-subscribers: {"message":"fan-out test"}
[EventService] Event published — both subscribers should receive it
```

## Key Code

**Two handler classes** — both subscribe to the same channel:

```typescript
// subscriber-a.handler.ts
@EventHandler('nestjs-events.multiple-subscribers')
async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> { ... }

// subscriber-b.handler.ts
@EventHandler('nestjs-events.multiple-subscribers')
async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> { ... }
```

Both classes are registered as providers in `AppModule`, and KubeMQ delivers every event to both.
