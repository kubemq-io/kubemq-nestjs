# Connection Error

Demonstrates handling ConnectionError, KubeMQTimeoutError, and ConnectionNotReadyError by attempting connection to an invalid address, catching typed exceptions, and mapping raw errors to KubeMQRpcException.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `KubeMQRpcException` — typed RPC error with statusCode, kubemqCode, kubemqCategory
- `ConnectionNotReadyError` — re-exported from kubemq-js for connection state checks
- `mapErrorToRpcException()` — maps raw errors to structured KubeMQRpcException
- `KubeMQClientProxy` — client proxy injection and connect/send

## Run

```bash
npx tsx examples/error-handling/connection-error/main.ts
```
