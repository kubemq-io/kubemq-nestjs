# Query Group (RPC)

Demonstrates `@QueryHandler` with the `group` option for load-balanced query handling. When multiple handler instances share the same group, each query is delivered to only one member.

## What This Demonstrates

- `@QueryHandler('channel', { group: 'nestjs-rpc-query-group' })` for group-based load balancing
- `KubeMQRecord.asQuery()` to mark records as queries
- Multiple queries sent sequentially to the same group channel
- Each query handled by exactly one group member
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/query-group/main.ts
```

## Expected Output

```
[QueryGroupExample] KubeMQ microservice started with query group handler
[QueryService] Sending 3 queries to group channel...
[QueryHandler] [group=nestjs-rpc-query-group] Query 1 on nestjs-rpc.query-group: {"seq":1,"lookup":"inventory"}
[QueryService] Query 1 response: {"seq":1,"lookup":"inventory","available":42,"group":"nestjs-rpc-query-group"}
[QueryHandler] [group=nestjs-rpc-query-group] Query 2 on nestjs-rpc.query-group: {"seq":2,"lookup":"inventory"}
[QueryService] Query 2 response: {"seq":2,"lookup":"inventory","available":42,"group":"nestjs-rpc-query-group"}
[QueryHandler] [group=nestjs-rpc-query-group] Query 3 on nestjs-rpc.query-group: {"seq":3,"lookup":"inventory"}
[QueryService] Query 3 response: {"seq":3,"lookup":"inventory","available":42,"group":"nestjs-rpc-query-group"}
[QueryService] All queries completed
```

## Key Code

**Handler** — handles queries within a named group:

```typescript
@QueryHandler('nestjs-rpc.query-group', { group: 'nestjs-rpc-query-group' })
async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
  return { seq: data.seq, lookup: data.lookup, available: 42, group: 'nestjs-rpc-query-group' };
}
```

**Service** — sends queries as KubeMQRecord:

```typescript
const record = new KubeMQRecord({ seq: i, lookup: 'inventory' }).asQuery();
const response = await firstValueFrom(this.client.send('nestjs-rpc.query-group', record));
```
