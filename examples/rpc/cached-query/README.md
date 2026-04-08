# Cached Query (RPC)

Demonstrates sending a query with `cacheKey` and `cacheTtlInSeconds` metadata so the broker caches the response for subsequent identical queries.

## What This Demonstrates

- `KubeMQRecord.asQuery().withMetadata()` for setting cache parameters
- `cacheKey` — the broker-side cache key for this query
- `cacheTtl` — how long (in seconds) the cached response lives
- `@QueryHandler` processing the query on first invocation
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/cached-query/main.ts
```

## Expected Output

```
[CachedQueryExample] KubeMQ microservice started
[QueryService] Sending query with cacheKey and cacheTtl...
[QueryHandler] Processing query on nestjs-rpc.cached-query: {"configKey":"app.settings"}
[QueryService] Query response: {"configKey":"app.settings","value":"production","version":1,"cached":false}
```

## Key Code

**Service** — sends a query with cache metadata:

```typescript
const record = new KubeMQRecord({ configKey: 'app.settings' })
  .asQuery()
  .withMetadata({ cacheKey: 'config:app.settings', cacheTtl: 60 });
const response = await firstValueFrom(this.client.send('nestjs-rpc.cached-query', record));
```

**Handler** — processes the query (invoked only on cache miss):

```typescript
@QueryHandler('nestjs-rpc.cached-query')
async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
  return { configKey: data.configKey, value: 'production', version: 1, cached: false };
}
```
