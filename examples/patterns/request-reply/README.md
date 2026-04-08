# Request-Reply Pattern

Demonstrates the full request-reply cycle using both `@CommandHandler` and `@QueryHandler` in a single handler class, with a service that sends commands and queries.

## What This Demonstrates

- `@CommandHandler` for processing commands with `client.send()`
- `@QueryHandler` for processing queries with `client.send()` + `KubeMQRecord.asQuery()`
- `KubeMQCommandContext` and `KubeMQQueryContext` for accessing request metadata
- Both command and query handlers returning response data to the caller

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/patterns/request-reply/main.ts
```

## Expected Output

```
[RequestReplyExample] KubeMQ microservice started
[RequestReplyService] Sending command (request-reply)...
[RequestReplyHandler] Command received on nestjs-patterns.request-reply.commands: {"action":"create-item","payload":"item-data"}
[RequestReplyService] Command response: {"executed":true,"action":"create-item","processedAt":"..."}
[RequestReplyService] Sending query (request-reply)...
[RequestReplyHandler] Query received on nestjs-patterns.request-reply.queries: {"id":"item-42"}
[RequestReplyService] Query response: {"id":"item-42","name":"Sample Item","status":"active","queriedAt":"..."}
```

## Key Code

**Handler — commands and queries in one class:**

```typescript
@CommandHandler('nestjs-patterns.request-reply.commands')
async handleCommand(data: { action: string }, ctx: KubeMQCommandContext) {
  return { executed: true, action: data.action };
}

@QueryHandler('nestjs-patterns.request-reply.queries')
async handleQuery(data: { id: string }, ctx: KubeMQQueryContext) {
  return { id: data.id, name: 'Sample Item', status: 'active' };
}
```

**Service — send command (default) vs query (KubeMQRecord):**

```typescript
// Command: client.send() defaults to command type
const cmdResult = await firstValueFrom(
  this.client.send('nestjs-patterns.request-reply.commands', { action: 'create-item' }),
);

// Query: use KubeMQRecord.asQuery() to override type
const queryResult = await firstValueFrom(
  this.client.send('nestjs-patterns.request-reply.queries', new KubeMQRecord({ id: 'item-42' }).asQuery()),
);
```
