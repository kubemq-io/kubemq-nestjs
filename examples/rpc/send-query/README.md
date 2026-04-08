# Send Query (RPC)

Demonstrates sending a query via `client.send()` with `KubeMQRecord.asQuery()` and receiving a JSON response from a `@QueryHandler`.

## What This Demonstrates

- `@QueryHandler` decorator for handling queries on a channel
- `KubeMQRecord.asQuery()` to mark a record as a query type
- `KubeMQClientProxy` with `client.send()` + `firstValueFrom()` for query/response RPC
- `KubeMQQueryContext` for accessing query metadata (channel, fromClientId, replyChannel)
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/send-query/main.ts
```

## Expected Output

```
[SendQueryExample] KubeMQ microservice started
[QueryService] Sending query...
[QueryHandler] Received query on nestjs-rpc.send-query: {"userId":"USR-42"}
[QueryService] Query response: {"userId":"USR-42","name":"Alice","email":"alice@example.com","role":"admin"}
```

## Key Code

**Handler** — processes queries and returns JSON data:

```typescript
@QueryHandler('nestjs-rpc.send-query')
async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
  return { userId: data.userId, name: 'Alice', email: 'alice@example.com', role: 'admin' };
}
```

**Service** — sends a query using KubeMQRecord:

```typescript
const record = new KubeMQRecord({ userId: 'USR-42' }).asQuery();
const response = await firstValueFrom(this.client.send('nestjs-rpc.send-query', record));
```
