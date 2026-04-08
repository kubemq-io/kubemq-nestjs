# Send Command (RPC)

Demonstrates sending a command via `client.send()` and receiving a response from a `@CommandHandler`.

## What This Demonstrates

- `@CommandHandler` decorator for handling commands on a channel
- `KubeMQClientProxy` with `client.send()` + `firstValueFrom()` for RPC-style command/response
- `KubeMQCommandContext` for accessing command metadata (channel, fromClientId, replyChannel)
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/send-command/main.ts
```

## Expected Output

```
[SendCommandExample] KubeMQ microservice started
[CommandService] Sending command...
[CommandHandler] Received command on nestjs-rpc.send-command: {"action":"create-user","name":"Alice"}
[CommandService] Command response: {"executed":true,"action":"create-user"}
```

## Key Code

**Handler** — processes commands and returns a result:

```typescript
@CommandHandler('nestjs-rpc.send-command')
async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
  return { executed: true, action: data.action };
}
```

**Service** — sends commands via the client proxy:

```typescript
const response = await firstValueFrom(
  this.client.send('nestjs-rpc.send-command', { action: 'create-user', name: 'Alice' }),
);
```
