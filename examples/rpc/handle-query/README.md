# Handle Query (RPC)

Demonstrates a `@QueryHandler` that processes incoming queries and returns a rich JSON response.

## What This Demonstrates

- `@QueryHandler` decorator with business logic returning structured data
- `KubeMQQueryContext` for accessing query metadata
- `KubeMQRecord.asQuery()` to mark a record as a query type
- Query/response RPC pattern via `client.send()` + `firstValueFrom()`
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/handle-query/main.ts
```

## Expected Output

```
[HandleQueryExample] KubeMQ microservice started
[QueryService] Sending query...
[QueryHandler] Processing query on nestjs-rpc.handle-query: {"productId":"PROD-100"}
[QueryService] Query response: {"productId":"PROD-100","name":"Widget Pro","price":29.99,"inStock":true,"categories":["electronics","gadgets"]}
```

## Key Code

**Handler** — processes the query and returns structured data:

```typescript
@QueryHandler('nestjs-rpc.handle-query')
async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
  return {
    productId: data.productId,
    name: 'Widget Pro',
    price: 29.99,
    inStock: true,
    categories: ['electronics', 'gadgets'],
  };
}
```

**Service** — sends a query using KubeMQRecord:

```typescript
const record = new KubeMQRecord({ productId: 'PROD-100' }).asQuery();
const response = await firstValueFrom(this.client.send('nestjs-rpc.handle-query', record));
```
