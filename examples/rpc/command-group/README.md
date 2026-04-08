# Command Group (RPC)

Demonstrates `@CommandHandler` with the `group` option for load-balanced command handling. When multiple handler instances share the same group, each command is delivered to only one member.

## What This Demonstrates

- `@CommandHandler('channel', { group: 'nestjs-rpc-cmd-group' })` for group-based load balancing
- Multiple commands sent sequentially to the same group channel
- Each command handled by exactly one group member
- `KubeMQModule.forRoot()` for server/handler registration
- `KubeMQModule.register()` for named client injection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/rpc/command-group/main.ts
```

## Expected Output

```
[CommandGroupExample] KubeMQ microservice started with command group handler
[CommandService] Sending 3 commands to group channel...
[CommandHandler] [group=nestjs-rpc-cmd-group] Command 1 on nestjs-rpc.command-group: {"seq":1,"task":"process"}
[CommandHandler] [group=nestjs-rpc-cmd-group] Command 2 on nestjs-rpc.command-group: {"seq":2,"task":"process"}
[CommandHandler] [group=nestjs-rpc-cmd-group] Command 3 on nestjs-rpc.command-group: {"seq":3,"task":"process"}
[CommandService] All commands completed
```

## Key Code

**Handler** — handles commands within a named group:

```typescript
@CommandHandler('nestjs-rpc.command-group', { group: 'nestjs-rpc-cmd-group' })
async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
  return { executed: true, seq: data.seq, group: 'nestjs-rpc-cmd-group' };
}
```

**Service** — sends multiple commands to the group channel:

```typescript
for (let i = 1; i <= 3; i++) {
  await firstValueFrom(
    this.client.send('nestjs-rpc.command-group', { seq: i, task: 'process' }),
  );
}
```
