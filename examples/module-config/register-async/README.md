# registerAsync

Demonstrates `KubeMQModule.registerAsync()` with `ConfigService` for creating a named client proxy with async-resolved options.

## What This Demonstrates

- `KubeMQModule.registerAsync()` — creates a named client with async factory
- `ConfigService` injection — resolves address from environment at bootstrap
- `@Inject('NOTIFICATION_SERVICE')` — injects the async-created client by token
- Combined `forRootAsync()` + `registerAsync()` in one module

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/module-config/register-async/main.ts
```

## Expected Output

```
[RegisterAsyncExample] KubeMQ microservice started with registerAsync()
[NotificationService] Sending notification via async-registered client...
[NotificationHandler] Notification received on nestjs-module-config.register-async: {"to":"user@example.com","subject":"Welcome"}
[NotificationService] Notification response: {"sent":true,"to":"user@example.com"}
```

## Key Code

**Module** — async client registration with `useFactory`:

```typescript
KubeMQModule.registerAsync({
  name: 'NOTIFICATION_SERVICE',
  useFactory: (config: ConfigService) => ({
    address: config.get('KUBEMQ_ADDRESS', 'localhost:50000'),
    clientId: 'nestjs-module-config-register-async-client',
  }),
  inject: [ConfigService],
})
```
