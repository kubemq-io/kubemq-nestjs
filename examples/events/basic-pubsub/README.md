# Basic Pub/Sub Events

Demonstrates fire-and-forget event publishing and subscribing using `@EventHandler` and `KubeMQClientProxy.emit()`.

## What This Demonstrates

- `@EventHandler` decorator for subscribing to events on a channel
- `KubeMQClientProxy` with `client.emit()` + `firstValueFrom()` for publishing
- `KubeMQContext` for accessing event metadata (channel, id, timestamp)
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/events/basic-pubsub/main.ts
```

## Expected Output

```
[BasicPubSubExample] KubeMQ microservice started
[EventService] Publishing event...
[EventHandler] Received event on nestjs-events.basic-pubsub: {"message":"Hello from NestJS"}
[EventService] Event published successfully
```

## Key Code

**Handler** — subscribes to events on the channel:

```typescript
@EventHandler('nestjs-events.basic-pubsub')
async handleEvent(data: unknown, ctx: KubeMQContext): Promise<void> {
  this.logger.log(`Received event on ${ctx.channel}: ${JSON.stringify(data)}`);
}
```

**Service** — publishes events via the client proxy:

```typescript
await firstValueFrom(
  this.client.emit('nestjs-events.basic-pubsub', { message: 'Hello from NestJS' }),
);
```
