# Ping

Demonstrates health check ping via KubeMQClientProxy, accessing the underlying kubemq-js client to retrieve server info (host, version, uptime).

## Prerequisites
- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used
- `KubeMQModule.register()` — named client proxy registration
- `KubeMQClientProxy` — client proxy for broker communication
- `KubeMQClientProxy.unwrap()` — access underlying kubemq-js client
- `KubeMQClient.ping()` — broker health check

## Run
```bash
npx tsx examples/connection/ping/main.ts
```
