# Exception Filter

Demonstrates a custom NestJS ExceptionFilter that catches KubeMQRpcException and maps KubeMQ errors to structured HTTP JSON responses with statusCode, kubemqCode, kubemqCategory, and channel.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `KubeMQRpcException` — typed RPC exception extending NestJS RpcException
- `KubeMQRpcError` — error shape with statusCode, kubemqCode, kubemqCategory, channel
- `mapErrorToRpcException()` — error mapping utility
- `@Catch(KubeMQRpcException)` — NestJS exception filter integration
- `APP_FILTER` — global filter registration via DI

## Run

```bash
npx tsx examples/error-handling/exception-filter/main.ts
```
