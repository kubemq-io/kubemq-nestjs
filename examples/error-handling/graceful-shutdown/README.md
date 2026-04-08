# Graceful Shutdown

Demonstrates clean shutdown with multiple active subscriptions, enableShutdownHooks(), and drain callbacks ensuring all in-flight messages are processed before the application exits.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `enableShutdownHooks()` — NestJS OS signal handling (SIGTERM/SIGINT)
- `app.close()` — triggers graceful drain of all KubeMQ subscriptions
- `KubeMQServer` — `callbackTimeoutSeconds` configuration
- `@EventHandler` / `@CommandHandler` — multiple concurrent subscriptions

## Run

```bash
npx tsx examples/error-handling/graceful-shutdown/main.ts
```
