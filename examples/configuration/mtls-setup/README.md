# Mutual TLS Setup

Demonstrates mutual TLS (mTLS) with client certificates for both server and client authentication.

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- Dependencies installed: `cd examples && npm install`

## Features Used

- `KubeMQServer` with `tls.caCert`, `tls.clientCert`, `tls.clientKey` options
- Mutual TLS client certificate authentication
- `KubeMQModule.forRoot` configuration

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KUBEMQ_ADDRESS` | `localhost:50000` | KubeMQ server address |
| `KUBEMQ_CA_CERT` | `/path/to/ca.pem` | Path to the CA certificate file |
| `KUBEMQ_CLIENT_CERT` | `/path/to/client.pem` | Path to the client certificate file |
| `KUBEMQ_CLIENT_KEY` | `/path/to/client-key.pem` | Path to the client private key file |

## Run

```bash
KUBEMQ_CA_CERT=/path/to/ca.pem KUBEMQ_CLIENT_CERT=/path/to/client.pem KUBEMQ_CLIENT_KEY=/path/to/client-key.pem \
  npx tsx examples/configuration/mtls-setup/main.ts
```
