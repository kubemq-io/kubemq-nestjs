# Decorator Options

Demonstrates common handler decorator options: `group`, `maxConcurrent`, `startFrom`, `manualAck`, `maxMessages`, and `waitTimeoutSeconds`.

## What This Demonstrates

- `@CommandHandler(channel, { group })` — load-balanced command handling
- `@QueryHandler(channel, { group, maxConcurrent })` — concurrent query processing
- `@EventHandler(channel, { group })` — grouped event subscription
- `@EventStoreHandler(channel, { group, startFrom })` — replay from first stored event
- `@QueueHandler(channel, { manualAck, maxMessages, waitTimeoutSeconds })` — queue tuning

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/decorators/decorator-options/main.ts
```

## Expected Output

```
[DecoratorOptionsExample] KubeMQ microservice started — decorator options configured
[SenderService] Sending command (group=cmd-workers)...
[OptionsHandler] [CMD group=cmd-workers] nestjs-decorators.options-cmd: {"action":"deploy"}
[SenderService] Command response: {"processed":true}
...
[SenderService] All messages sent
```

## Key Code

**Decorator options per handler type:**

```typescript
@CommandHandler('channel', { group: 'cmd-workers' })

@QueryHandler('channel', { group: 'query-workers', maxConcurrent: 5 })

@EventStoreHandler('channel', { group: 'store-group', startFrom: 'first' })

@QueueHandler('channel', { manualAck: true, maxMessages: 10, waitTimeoutSeconds: 5 })
```
