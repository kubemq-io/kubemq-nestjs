# Connect

Demonstrates basic NestJS app bootstrap with KubeMQModule.forRoot, verifying broker connection via connectMicroservice.

## Prerequisites
- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used
- `KubeMQModule.forRoot()` — static module configuration
- `KubeMQServer` — custom microservice transport strategy
- `app.connectMicroservice()` — NestJS microservice bootstrap

## Run
```bash
npx tsx examples/connection/connect/main.ts
```
