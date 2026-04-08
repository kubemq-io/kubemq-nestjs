# Unit Test Handlers

Shows how to test `@CommandHandler`-decorated handlers using NestJS `TestingModule` with the full DI container — no KubeMQ broker required.

## What This Demonstrates

- Setting up `TestingModule` with `CqrsModule` for handler testing
- Testing handler logic directly via `handler.execute()`
- Asserting success and error cases
- Verifying handler DI resolution

## Run

```bash
npx vitest run --config examples/vitest.config.ts testing/unit-test-handlers/unit-test-handlers.spec.ts
```

## Key Code

**Setup** — TestingModule with CqrsModule:

```typescript
const module = await Test.createTestingModule({
  imports: [CqrsModule],
  providers: [CreateOrderHandler],
}).compile();

const handler = module.get(CreateOrderHandler);
```

**Test** — execute handler directly:

```typescript
const result = await handler.execute(new CreateOrderCommand('WIDGET-42', 3));
expect(result).toEqual({ orderId: 'ORD-WIDGET-42-3', status: 'created' });
```
