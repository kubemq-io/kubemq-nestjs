# Handle Command (RPC)

Demonstrates a `@CommandHandler` that processes incoming commands and returns a structured response.

## What This Demonstrates

- `@CommandHandler` decorator with business logic that returns a response
- `KubeMQCommandContext` for accessing channel and sender metadata
- Command/response RPC pattern via `client.send()` + `firstValueFrom()`
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/handle-command/main.ts
```

## Expected Output

```
[HandleCommandExample] KubeMQ microservice started
[CommandService] Sending command to handler...
[CommandHandler] Processing command on nestjs-rpc.handle-command: {"orderId":"ORD-001","status":"approved"}
[CommandHandler] Command processed — order ORD-001 approved
[CommandService] Handler response: {"processed":true,"orderId":"ORD-001","result":"order-approved"}
```

## Key Code

**Handler** — processes the command and returns a result:

```typescript
@CommandHandler('nestjs-rpc.handle-command')
async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
  const orderId = data.orderId as string;
  return { processed: true, orderId, result: `order-${data.status}` };
}
```

**Service** — sends the command and awaits the response:

```typescript
const response = await firstValueFrom(
  this.client.send('nestjs-rpc.handle-command', { orderId: 'ORD-001', status: 'approved' }),
);
```
