# CQRS Commands

Demonstrates dispatching commands via `@nestjs/cqrs` `CommandBus` with KubeMQ as the transport layer using `KubeMQCqrsModule`.

## What This Demonstrates

- `KubeMQCqrsModule.forRoot()` wiring with `CqrsModule`
- `CommandBus.execute()` dispatching commands over KubeMQ command channels
- `@CommandHandler` decorator for handling commands
- Channel prefix configuration via `commandChannelPrefix`

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/cqrs/cqrs-commands/main.ts
```

## Expected Output

```
[CqrsCommandsExample] KubeMQ microservice started
[OrderService] Dispatching CreateOrderCommand: product=WIDGET-42
[CreateOrderHandler] Processing order: product=WIDGET-42, qty=3
[OrderService] Command executed successfully
```

## Key Code

**Module** — wires KubeMQ + CQRS:

```typescript
@Module({
  imports: [
    KubeMQModule.forRoot({ address, clientId: 'nestjs-cqrs-commands', isGlobal: true }),
    CqrsModule,
    KubeMQCqrsModule.forRoot({ commandChannelPrefix: 'nestjs-cqrs.commands' }),
  ],
})
export class AppModule {}
```

**Service** — dispatches commands:

```typescript
await this.commandBus.execute(new CreateOrderCommand('WIDGET-42', 3));
```
