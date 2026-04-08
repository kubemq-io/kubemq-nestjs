# Token Authentication

Demonstrates token-based authentication via the `credentials` option on both server and client sides.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `KubeMQServer` with `credentials` option
- `KubeMQModule.forRoot` with token authentication
- `KubeMQModule.register` with token authentication (client side)

## Run

```bash
npx tsx examples/configuration/token-auth/main.ts
```
