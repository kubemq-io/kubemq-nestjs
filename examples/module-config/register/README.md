# register — Named Client Injection

Demonstrates `KubeMQModule.register()` for creating a named client proxy. The client is injected via `@Inject('KUBEMQ_SERVICE')` and used to send events to the broker.

## What This Demonstrates

- `KubeMQModule.register()` — named client proxy registration
- `@Inject('KUBEMQ_SERVICE')` — injecting the named client
- `KubeMQClientProxy` — sending events via `client.emit()`
- `KubeMQRecord` — wrapping payloads for transport

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/module-config/register/main.ts
```

## Expected Output

```
[RegisterExample] App created with KubeMQModule.register() — named client injection
[SenderService] Sending event via named KUBEMQ_SERVICE client...
[SenderService] Event sent successfully
[RegisterExample] Shutting down...
```

## Key Code

**Named client registration:**

```typescript
KubeMQModule.register({
  name: 'KUBEMQ_SERVICE',
  address,
  clientId: 'nestjs-module-config-register-client',
})
```

**Injecting the named client:**

```typescript
constructor(@Inject('KUBEMQ_SERVICE') private readonly client: KubeMQClientProxy) {}
```
