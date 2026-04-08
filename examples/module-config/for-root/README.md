# forRoot — Static Module Configuration

Demonstrates `KubeMQModule.forRoot()` with inline static options. This is the simplest configuration pattern: address and options are passed directly at module import time.

## What This Demonstrates

- `KubeMQModule.forRoot()` — static server options with `isGlobal: true`
- `KubeMQServer` — custom microservice transport strategy
- `reconnect` option for automatic reconnection

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/module-config/for-root/main.ts
```

## Expected Output

```
[ForRootExample] KubeMQ microservice started with forRoot() configuration
[ForRootExample] Broker address: localhost:50000
[ForRootExample] Shutting down...
```

## Key Code

**Static module configuration:**

```typescript
KubeMQModule.forRoot({
  address,
  clientId: 'nestjs-module-config-for-root-server',
  isGlobal: true,
  reconnect: { isReconnect: true },
})
```
