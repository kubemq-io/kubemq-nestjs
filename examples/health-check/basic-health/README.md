# Basic Health Check

Demonstrates `KubeMQHealthIndicator` with a simple HTTP health endpoint at `GET /health`.

## What This Demonstrates

- `KubeMQHealthIndicator.fromServer()` for creating the indicator from a running server
- Simple health controller with `GET /health` endpoint
- Health status responses: `up`, `degraded`, `down`
- Latency measurement in health response

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/health-check/basic-health/main.ts
```

## Test

```bash
curl http://localhost:3000/health
```

## Expected Output

**Console:**

```
[BasicHealthExample] KubeMQ microservice started
[BasicHealthExample] Health indicator initialized from KubeMQ server
[BasicHealthExample] HTTP server listening on http://localhost:3000
[BasicHealthExample] Health endpoint: http://localhost:3000/health
```

**HTTP Response:**

```json
{"kubemq":{"status":"up","latencyMs":2}}
```

## Key Code

**Health indicator** — created from running server:

```typescript
const kubemqServer = new KubeMQServer({ address, clientId: '...' });
app.connectMicroservice({ strategy: kubemqServer });
await app.startAllMicroservices();

const indicator = KubeMQHealthIndicator.fromServer(kubemqServer);
```

**Controller** — exposes health endpoint:

```typescript
@Get()
async check() {
  return this.healthService.check(); // → { kubemq: { status: 'up', latencyMs: 2 } }
}
```
