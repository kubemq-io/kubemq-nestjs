# Custom Timeouts

Demonstrates configuring connection timeout, command timeout, query timeout, and callback timeout in `KubeMQServerOptions`.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `KubeMQServer` timeout options (`defaultCommandTimeout`, `defaultQueryTimeout`, `callbackTimeoutSeconds`)
- `retry` and `keepalive` configuration
- `@CommandHandler` decorator with timeout-aware handler

## Run

```bash
npx tsx examples/configuration/custom-timeouts/main.ts
```
