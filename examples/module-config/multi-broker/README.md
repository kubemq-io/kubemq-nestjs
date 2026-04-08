# multi-broker

Demonstrates two `KubeMQModule.register()` calls to connect to different brokers (or the same broker with different client identities).

## What This Demonstrates

- Multiple `KubeMQModule.register()` calls in one module — each with a unique `name` token
- `@Inject('PRIMARY_BROKER')` / `@Inject('SECONDARY_BROKER')` — inject different clients
- Sending events to different brokers from a single service
- `@EventHandler` — receives events from both channels

## Prerequisites

- KubeMQ server(s) running (defaults: `KUBEMQ_PRIMARY_ADDRESS=localhost:50000`, `KUBEMQ_SECONDARY_ADDRESS=localhost:50000`)

## Run

```bash
npx tsx examples/module-config/multi-broker/main.ts
```

## Expected Output

```
[MultiBrokerExample] KubeMQ microservice started with multi-broker config
[MultiBrokerService] Sending event to primary broker...
[MultiBrokerHandler] [PRIMARY] Received on nestjs-module-config.multi-broker-primary: ...
[MultiBrokerService] Event sent to primary broker
[MultiBrokerService] Sending event to secondary broker...
[MultiBrokerHandler] [SECONDARY] Received on nestjs-module-config.multi-broker-secondary: ...
[MultiBrokerService] Event sent to secondary broker
```

## Key Code

**Module** — two named clients:

```typescript
KubeMQModule.register({
  name: 'PRIMARY_BROKER',
  address: primaryAddress,
  clientId: 'multi-broker-primary',
}),
KubeMQModule.register({
  name: 'SECONDARY_BROKER',
  address: secondaryAddress,
  clientId: 'multi-broker-secondary',
}),
```

**Service** — injects both:

```typescript
constructor(
  @Inject('PRIMARY_BROKER') private readonly primary: KubeMQClientProxy,
  @Inject('SECONDARY_BROKER') private readonly secondary: KubeMQClientProxy,
) {}
```
