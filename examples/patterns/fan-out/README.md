# Fan-Out Pattern

Demonstrates fan-out delivery where two separate `@EventHandler` classes subscribe to the same channel without a consumer group. Every event is delivered to **both** subscribers independently.

## What This Demonstrates

- Two `@EventHandler` classes on the same channel with no `group` option
- Each subscriber receives every event (fan-out / broadcast)
- `KubeMQClientProxy` with `client.emit()` for publishing events
- `KubeMQContext` for accessing event metadata

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/patterns/fan-out/main.ts
```

## Expected Output

```
[FanOutExample] Microservice started with two subscriber classes
[FanOutService] Publishing event to fan-out channel...
[SubscriberA] Received event on nestjs-patterns.fan-out: {"message":"broadcast to all subscribers"}
[SubscriberB] Received event on nestjs-patterns.fan-out: {"message":"broadcast to all subscribers"}
[FanOutService] Event published — both subscribers should receive it
```

## Key Code

**Two handler classes on the same channel (no group = fan-out):**

```typescript
@Injectable()
export class SubscriberA {
  @EventHandler('nestjs-patterns.fan-out')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`Received: ${JSON.stringify(data)}`);
  }
}

@Injectable()
export class SubscriberB {
  @EventHandler('nestjs-patterns.fan-out')
  async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
    this.logger.log(`Received: ${JSON.stringify(data)}`);
  }
}
```

**Publisher sends one event, both handlers receive it:**

```typescript
await firstValueFrom(
  this.client.emit('nestjs-patterns.fan-out', { message: 'broadcast to all subscribers' }),
);
```
