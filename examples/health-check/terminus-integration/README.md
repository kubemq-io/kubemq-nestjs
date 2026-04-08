# Terminus Integration

Demonstrates `KubeMQHealthIndicator` integrated with `@nestjs/terminus` `HealthCheckService` for production-grade health endpoints with standardized response format.

## What This Demonstrates

- `@nestjs/terminus` `TerminusModule` + `HealthCheckService` integration
- `KubeMQHealthIndicator` as a terminus-compatible health indicator
- `@HealthCheck()` decorator for standardized health responses
- Aggregated status with `info` / `error` / `details` sections

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- `@nestjs/terminus` installed: `npm install @nestjs/terminus`

## Run

```bash
npx tsx examples/health-check/terminus-integration/main.ts
```

## Test

```bash
curl http://localhost:3000/health
```

## Expected Output

**Console:**

```
[TerminusIntegrationExample] KubeMQ microservice started
[TerminusIntegrationExample] Terminus health indicator initialized
[TerminusIntegrationExample] HTTP server listening on http://localhost:3000
[TerminusIntegrationExample] Health endpoint: http://localhost:3000/health
```

**HTTP Response:**

```json
{
  "status": "ok",
  "info": { "kubemq": { "status": "up", "latencyMs": 2 } },
  "error": {},
  "details": { "kubemq": { "status": "up", "latencyMs": 2 } }
}
```

## Key Code

**Module** — wires Terminus:

```typescript
@Module({
  imports: [
    KubeMQModule.forRoot({ address, clientId: '...', isGlobal: true }),
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

**Controller** — Terminus health check:

```typescript
@Get()
@HealthCheck()
async check(): Promise<HealthCheckResult> {
  return this.health.check([
    () => this.indicator.isHealthy('kubemq'),
  ]);
}
```
