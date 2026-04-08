# CQRS Events

Demonstrates publishing domain events via `@nestjs/cqrs` `EventBus` with KubeMQ as the transport layer, using persistent event-store channels.

## What This Demonstrates

- `KubeMQCqrsModule.forRoot()` with `persistEvents: true` for event-store backed events
- `EventBus.publish()` dispatching events over KubeMQ event-store channels
- `@EventsHandler` decorator for handling domain events
- Channel prefix configuration via `eventChannelPrefix`

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/cqrs/cqrs-events/main.ts
```

## Expected Output

```
[CqrsEventsExample] KubeMQ microservice started
[OrderService] Publishing OrderCreatedEvent: id=ORD-100
[OrderCreatedHandler] Order created: id=ORD-100, product=GADGET-7, qty=5
[OrderService] Event published successfully
```

## Key Code

**Module** — enables persistent events:

```typescript
KubeMQCqrsModule.forRoot({
  eventChannelPrefix: 'nestjs-cqrs.events',
  persistEvents: true,
})
```

**Service** — publishes domain events:

```typescript
this.eventBus.publish(new OrderCreatedEvent(orderId, product, quantity));
```
