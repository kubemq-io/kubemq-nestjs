# forRootAsync — Async Module Configuration with ConfigService

Demonstrates `KubeMQModule.forRootAsync()` with `@nestjs/config` `ConfigService`. Options are resolved asynchronously at runtime, enabling environment-based configuration via `.env` files or environment variables.

## What This Demonstrates

- `KubeMQModule.forRootAsync()` — async server options with `useFactory` + `inject`
- `ConfigModule.forRoot()` — NestJS config integration
- `ConfigService` — reading `KUBEMQ_ADDRESS` from environment

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/module-config/for-root-async/main.ts
```

## Expected Output

```
[ForRootAsyncExample] KubeMQ microservice started with forRootAsync() configuration
[ForRootAsyncExample] Broker address (from ConfigService): localhost:50000
[ForRootAsyncExample] Shutting down...
```

## Key Code

**Async module configuration with ConfigService:**

```typescript
KubeMQModule.forRootAsync({
  useFactory: (config: ConfigService) => ({
    address: config.get('KUBEMQ_ADDRESS', 'localhost:50000'),
    clientId: 'nestjs-module-config-for-root-async-server',
    reconnect: { isReconnect: true },
  }),
  inject: [ConfigService],
})
```
