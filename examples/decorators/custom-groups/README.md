# Custom Groups

Demonstrates multiple handlers on the same channel with different `group` options, showing load-balanced commands and fan-out events.

## What This Demonstrates

- **Commands with groups** — `billing` and `shipping` groups compete for the same command channel (load-balanced: one group wins per message)
- **Events with groups** — `billing`, `shipping`, and `analytics` groups each receive a copy of the same event (fan-out per group)
- Multiple `@Injectable()` handler services with different group assignments
- Real-world pattern: microservice-style routing within a monolith

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/decorators/custom-groups/main.ts
```

## Expected Output

```
[CustomGroupsExample] KubeMQ microservice started — 3 groups: billing, shipping, analytics
[SenderService] Sending command to orders channel (billing & shipping groups compete)...
[BillingHandler] [billing] Order on nestjs-decorators.custom-groups-orders: ...
[SenderService] Command response: {"handler":"billing","invoiceCreated":true}
[SenderService] Emitting notification (each group receives a copy)...
[BillingHandler] [billing] Notification on nestjs-decorators.custom-groups-notifications: ...
[ShippingHandler] [shipping] Notification on nestjs-decorators.custom-groups-notifications: ...
[AnalyticsHandler] [analytics] Notification on nestjs-decorators.custom-groups-notifications: ...
[SenderService] Notification emitted to all groups
```

## Key Code

**Same channel, different groups:**

```typescript
// billing.handler.ts
@CommandHandler('orders', { group: 'billing' })
async handleOrder(data, ctx) { ... }

// shipping.handler.ts
@CommandHandler('orders', { group: 'shipping' })
async handleOrder(data, ctx) { ... }

// analytics.handler.ts (events only)
@EventHandler('notifications', { group: 'analytics' })
async handleNotification(data, ctx) { ... }
```
