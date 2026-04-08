# Logger Bridge Setup (Observability)

Demonstrates `createNestKubeMQLogger` — a bridge that routes kubemq-js internal `debug`/`info`/`warn`/`error` logs through the NestJS `Logger` system.

## What This Demonstrates

- `createNestKubeMQLogger(context)` creates a kubemq-js-compatible logger backed by NestJS `Logger`
- All four log levels (`debug`, `info`, `warn`, `error`) are bridged
- Optional `fields` parameter is serialized and appended to log messages
- `KubeMQServer` and `KubeMQClientProxy` use this bridge automatically under the hood
- You can create custom bridges for your own logging contexts

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/observability/logger-bridge-setup/main.ts
```

## Expected Output

```
[MyApp-KubeMQ] Logger bridge created — kubemq-js logs flow through NestJS
[MyApp-KubeMQ] Debug-level message {"component":"transport","latencyMs":12}
[MyApp-KubeMQ] Warning-level message {"retryAttempt":2}
[MyApp-KubeMQ] Error-level message {"code":"CONN_REFUSED","address":"localhost:50000"}
[LoggerBridgeExample] Microservice started — internal kubemq-js logs use NestJS Logger
```

## Key Code

**Creating a logger bridge:**

```typescript
import { createNestKubeMQLogger } from '@kubemq/nestjs-transport';

const kubemqLogger = createNestKubeMQLogger('MyApp-KubeMQ');

kubemqLogger.info('Connected to broker');
kubemqLogger.debug('Transport details', { latencyMs: 12 });
kubemqLogger.warn('Retry attempt', { retryAttempt: 2 });
kubemqLogger.error('Connection failed', { code: 'CONN_REFUSED' });
```

**How it works internally:**

`KubeMQServer` and `KubeMQClientProxy` automatically create their own logger bridges:

```typescript
// Inside KubeMQServer (automatic)
const client = await KubeMQSDKClient.create({
  address,
  logger: createNestKubeMQLogger('KubeMQServer'),
});
```

This means all kubemq-js transport logs (connection events, retries, errors) automatically flow through NestJS's logging pipeline, respecting your configured log levels.
