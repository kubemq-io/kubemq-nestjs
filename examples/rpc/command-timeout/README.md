# Command Timeout (RPC)

Demonstrates error handling when a command times out because no handler is registered to respond. The service sends a command with a short timeout and catches the resulting `KubeMQRpcException`.

## What This Demonstrates

- `KubeMQRecord.withMetadata({ timeout: 2 })` to set a custom command timeout
- No `@CommandHandler` registered — the command has no responder
- Catching `KubeMQRpcException` when the command times out
- Inspecting `KubeMQRpcError` fields: `statusCode` (408), `kubemqCode`, `message`
- Graceful error handling for timeout scenarios

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/command-timeout/main.ts
```

## Expected Output

```
[CommandTimeoutExample] KubeMQ microservice started (no handler registered for timeout channel)
[CommandService] Sending command with 2s timeout (no handler will respond)...
[CommandService] Caught expected timeout error:
[CommandService]   statusCode: 408
[CommandService]   message: Transport operation failed
[CommandService]   kubemqCode: TIMEOUT
[CommandService] Timeout handling completed successfully
```

## Key Code

**Service** — sends a command with a short timeout and catches the error:

```typescript
try {
  const record = new KubeMQRecord({ task: 'unreachable' }).withMetadata({ timeout: 2 });
  await firstValueFrom(this.client.send('nestjs-rpc.command-timeout', record));
} catch (err) {
  if (err instanceof KubeMQRpcException) {
    const error = err.getError() as KubeMQRpcError;
    logger.log(`statusCode: ${error.statusCode}`);   // 408
    logger.log(`kubemqCode: ${error.kubemqCode}`);   // TIMEOUT
  }
}
```
