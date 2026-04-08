# Full CQRS Flow

Demonstrates a complete CQRS flow using `@nestjs/cqrs` with KubeMQ: commands create state, events propagate changes, queries read the result.

## What This Demonstrates

- Full command → event → query pipeline over KubeMQ
- `CommandBus.execute()` creating an order and returning an ID
- Command handler emitting `OrderCreatedEvent` via `EventBus`
- `@EventsHandler` updating an in-memory read model (`OrderStore`)
- `QueryBus.execute()` reading back the created order from the store
- All three channel prefixes configured simultaneously

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/cqrs/full-cqrs-flow/main.ts
```

## Expected Output

```
[FullCqrsFlowExample] KubeMQ microservice started
[OrderService] Step 1: Dispatching CreateOrderCommand for product=WIDGET-42
[CreateOrderHandler] Creating order ORD-001: product=WIDGET-42, qty=3
[OrderCreatedHandler] Event received — storing order ORD-001
[OrderService] Step 1 complete: orderId=ORD-001
[OrderService] Step 2: Querying order ORD-001
[GetOrderHandler] Querying order: ORD-001
[OrderService] Step 2 complete: {"orderId":"ORD-001","productId":"WIDGET-42","quantity":3,"status":"created"}
```

## Key Code

**Module** — all three CQRS channel types:

```typescript
KubeMQCqrsModule.forRoot({
  commandChannelPrefix: 'nestjs-cqrs.full-flow.commands',
  queryChannelPrefix: 'nestjs-cqrs.full-flow.queries',
  eventChannelPrefix: 'nestjs-cqrs.full-flow.events',
})
```

**Command handler** — emits event after processing:

```typescript
@NestCommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  constructor(private readonly eventBus: EventBus) {}

  async execute(command: CreateOrderCommand): Promise<string> {
    const orderId = generateId();
    this.eventBus.publish(new OrderCreatedEvent(orderId, command.productId, command.quantity));
    return orderId;
  }
}
```
