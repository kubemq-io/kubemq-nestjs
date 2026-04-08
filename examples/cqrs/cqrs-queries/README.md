# CQRS Queries

Demonstrates dispatching queries via `@nestjs/cqrs` `QueryBus` with KubeMQ as the transport layer using `KubeMQCqrsModule`.

## What This Demonstrates

- `KubeMQCqrsModule.forRoot()` wiring with `CqrsModule`
- `QueryBus.execute()` dispatching queries over KubeMQ query channels
- `@QueryHandler` decorator for handling queries and returning results
- Channel prefix configuration via `queryChannelPrefix`

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/cqrs/cqrs-queries/main.ts
```

## Expected Output

```
[CqrsQueriesExample] KubeMQ microservice started
[OrderService] Querying order: ORD-001
[GetOrderHandler] Fetching order: ORD-001
[OrderService] Query result: {"orderId":"ORD-001","product":"WIDGET-42","status":"shipped"}
```

## Key Code

**Module** — wires KubeMQ + CQRS:

```typescript
@Module({
  imports: [
    KubeMQModule.forRoot({ address, clientId: 'nestjs-cqrs-queries', isGlobal: true }),
    CqrsModule,
    KubeMQCqrsModule.forRoot({ queryChannelPrefix: 'nestjs-cqrs.queries' }),
  ],
})
export class AppModule {}
```

**Service** — dispatches queries and receives results:

```typescript
const result = await this.queryBus.execute<GetOrderQuery, GetOrderResult>(
  new GetOrderQuery('ORD-001'),
);
```
