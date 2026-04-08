# Close

Demonstrates graceful shutdown with app.close(), proper resource cleanup, and enableShutdownHooks() for OS signal handling.

## Prerequisites
- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used
- `KubeMQModule.forRoot()` — static module configuration
- `KubeMQServer` — custom microservice transport strategy
- `app.enableShutdownHooks()` — OS signal handling (SIGTERM/SIGINT)
- `app.close()` — graceful resource cleanup

## Run
```bash
npx tsx examples/connection/close/main.ts
```
