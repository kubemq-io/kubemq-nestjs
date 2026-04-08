# Custom Logger

Demonstrates `createNestKubeMQLogger` bridge connecting kubemq-js internal logs to the NestJS Logger, showing debug/info/warn/error logs flowing through the NestJS logging system.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `createNestKubeMQLogger` logger bridge
- `KubeMQServer` with custom logger integration
- `KubeMQModule.forRoot` configuration

## Run

```bash
npx tsx examples/configuration/custom-logger/main.ts
```
