# Query Cache Hit (RPC)

Demonstrates KubeMQ query caching by sending two identical queries. The first invokes the handler (cache miss); the second returns the cached response without invoking the handler (cache hit).

## What This Demonstrates

- `KubeMQRecord.asQuery().withMetadata()` with `cacheKey` and `cacheTtl`
- Cache miss on first query — handler is invoked
- Cache hit on second query — handler is **not** invoked, broker returns cached response
- Verifying cache behavior by comparing handler invocation counts

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/query-cache-hit/main.ts
```

## Expected Output

```
[QueryCacheHitExample] KubeMQ microservice started
[QueryService] --- Query 1 (cache miss) ---
[QueryService] Sending query with cacheKey...
[QueryHandler] Processing query on nestjs-rpc.query-cache-hit: {"key":"exchange-rate","currency":"USD"}
[QueryService] Response 1: {"currency":"USD","rate":1.0,"source":"handler","timestamp":...}
[QueryService] --- Query 2 (cache hit) ---
[QueryService] Sending same query again (should hit cache)...
[QueryService] Response 2: {"currency":"USD","rate":1.0,"source":"handler","timestamp":...}
[QueryService] Cache hit confirmed — handler was NOT invoked for query 2
```

## Key Code

**Service** — sends two queries with the same cacheKey:

```typescript
const record = new KubeMQRecord({ key: 'exchange-rate', currency: 'USD' })
  .asQuery()
  .withMetadata({ cacheKey: 'rate:USD', cacheTtl: 30 });
const response = await firstValueFrom(this.client.send('nestjs-rpc.query-cache-hit', record));
```

**Handler** — tracks invocations to prove cache hit:

```typescript
@QueryHandler('nestjs-rpc.query-cache-hit')
async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
  this.invocationCount++;
  return { currency: data.currency, rate: 1.0, source: 'handler', invocation: this.invocationCount };
}
```
