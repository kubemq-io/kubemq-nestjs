# TLS Setup

Demonstrates TLS connection with server certificate verification.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `KubeMQServer` with `tls.caCert` option
- TLS server certificate verification
- `KubeMQModule.forRoot` configuration

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KUBEMQ_ADDRESS` | `localhost:50000` | KubeMQ server address |
| `KUBEMQ_CA_CERT` | `/path/to/ca.pem` | Path to the CA certificate file |

## Run

```bash
KUBEMQ_CA_CERT=/path/to/ca.pem npx tsx examples/configuration/tls-setup/main.ts
```
