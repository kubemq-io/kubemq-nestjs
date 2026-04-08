# All Handlers

Demonstrates all 5 handler decorators in a single service: `@CommandHandler`, `@QueryHandler`, `@EventHandler`, `@EventStoreHandler`, `@QueueHandler`.

## What This Demonstrates

- `@CommandHandler` — request/response RPC with `KubeMQCommandContext`
- `@QueryHandler` — request/response query with `KubeMQQueryContext`
- `@EventHandler` — fire-and-forget pub/sub with `KubeMQContext`
- `@EventStoreHandler` — persistent events with `KubeMQEventStoreContext` and `sequence`
- `@QueueHandler` — queue consumption with `KubeMQQueueContext` and manual `ack()`
- `KubeMQRecord.asEventStore()` / `.asQueue()` — typed record wrappers for emit

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/decorators/all-handlers/main.ts
```

## Expected Output

```
[AllHandlersExample] KubeMQ microservice started — all 5 handler types registered
[SenderService] --- Sending command ---
[AllHandlers] [CMD] nestjs-decorators.all-handlers-cmd: {"action":"create"}
[SenderService] Command response: {"executed":true,"type":"command"}
[SenderService] --- Sending query ---
[AllHandlers] [QUERY] nestjs-decorators.all-handlers-query: {"search":"items"}
[SenderService] Query response: {"items":["a","b","c"],"type":"query"}
[SenderService] --- Emitting event ---
[AllHandlers] [EVENT] nestjs-decorators.all-handlers-event: {"alert":"user-login"}
[SenderService] Event emitted
[SenderService] --- Emitting event-store ---
[AllHandlers] [EVENT_STORE] nestjs-decorators.all-handlers-event-store (seq=...): ...
[SenderService] Event-store emitted
[SenderService] --- Sending queue message ---
[AllHandlers] [QUEUE] nestjs-decorators.all-handlers-queue: {"task":"process-image"}
[SenderService] Queue message sent
```

## Key Code

**All 5 decorators in one service:**

```typescript
@CommandHandler('nestjs-decorators.all-handlers-cmd')
async handleCommand(data, ctx: KubeMQCommandContext) { ... }

@QueryHandler('nestjs-decorators.all-handlers-query')
async handleQuery(data, ctx: KubeMQQueryContext) { ... }

@EventHandler('nestjs-decorators.all-handlers-event')
async handleEvent(data, ctx: KubeMQContext) { ... }

@EventStoreHandler('nestjs-decorators.all-handlers-event-store')
async handleEventStore(data, ctx: KubeMQEventStoreContext) { ... }

@QueueHandler('nestjs-decorators.all-handlers-queue', { manualAck: true })
async handleQueue(data, ctx: KubeMQQueueContext) { ctx.ack(); }
```
