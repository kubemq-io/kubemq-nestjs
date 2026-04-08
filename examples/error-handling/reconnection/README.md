# Reconnection

Demonstrates ReconnectionPolicy configuration options including maxAttempts, exponential backoff with jitter, and waitForConnection behavior allowing the app to start even when the broker is unavailable.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `KubeMQServer` — `reconnect` policy with `maxAttempts`, `initialDelayMs`, `maxDelayMs`, `multiplier`, `jitter`
- `waitForConnection: false` — non-blocking startup when broker is unavailable

## Run

```bash
npx tsx examples/error-handling/reconnection/main.ts
```
