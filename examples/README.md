# KubeMQ NestJS Transport Examples

Comprehensive examples demonstrating every feature of `@kubemq/nestjs-transport`.

## Prerequisites

- **Node.js** >= 20.11.0
- **KubeMQ Server** running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS` env var)
- **Install dependencies:**
  ```bash
  cd examples
  npm install
  ```

## Running Examples

Each example is a standalone NestJS mini-app:

```bash
npx tsx examples/{folder}/{name}/main.ts
```

---

## Connection

Establishing, verifying, and closing connections to the KubeMQ broker.

| Example | Description | Run |
|---------|-------------|-----|
| [connect](connection/connect/) | Basic `KubeMQModule.forRoot` connection with hybrid app | `npx tsx examples/connection/connect/main.ts` |
| [close](connection/close/) | Graceful shutdown with `app.close()` and resource cleanup | `npx tsx examples/connection/close/main.ts` |
| [ping](connection/ping/) | Health check ping via `KubeMQClientProxy` | `npx tsx examples/connection/ping/main.ts` |

---

## Configuration

Client setup options for authentication, TLS, timeouts, and logging.

| Example | Description | Run |
|---------|-------------|-----|
| [custom-logger](configuration/custom-logger/) | `createNestKubeMQLogger` bridge to NestJS Logger | `npx tsx examples/configuration/custom-logger/main.ts` |
| [custom-timeouts](configuration/custom-timeouts/) | Connection, command, query, and callback timeouts | `npx tsx examples/configuration/custom-timeouts/main.ts` |
| [tls-setup](configuration/tls-setup/) | TLS connection with server certificate verification | `npx tsx examples/configuration/tls-setup/main.ts` |
| [mtls-setup](configuration/mtls-setup/) | Mutual TLS with client certificates | `npx tsx examples/configuration/mtls-setup/main.ts` |
| [token-auth](configuration/token-auth/) | Token-based authentication via credentials option | `npx tsx examples/configuration/token-auth/main.ts` |

---

## Error Handling

Handling connection errors, reconnection policies, graceful shutdown, and exception filters.

| Example | Description | Run |
|---------|-------------|-----|
| [connection-error](error-handling/connection-error/) | Catching `ConnectionNotReadyError` and `KubeMQRpcException` | `npx tsx examples/error-handling/connection-error/main.ts` |
| [graceful-shutdown](error-handling/graceful-shutdown/) | Clean shutdown with active subscriptions and drain callbacks | `npx tsx examples/error-handling/graceful-shutdown/main.ts` |
| [reconnection](error-handling/reconnection/) | `ReconnectionPolicy` configuration (maxAttempts, backoff, jitter) | `npx tsx examples/error-handling/reconnection/main.ts` |
| [exception-filter](error-handling/exception-filter/) | Custom `@Catch(KubeMQRpcException)` exception filter for HTTP | `npx tsx examples/error-handling/exception-filter/main.ts` |

---

## Events

Fire-and-forget messages delivered to all active subscribers on a channel.

| Example | Description | Run |
|---------|-------------|-----|
| [basic-pubsub](events/basic-pubsub/) | `@EventHandler` + `client.emit()` for fire-and-forget events | `npx tsx examples/events/basic-pubsub/main.ts` |
| [cancel-subscription](events/cancel-subscription/) | Cancelling an event subscription at runtime | `npx tsx examples/events/cancel-subscription/main.ts` |
| [consumer-group](events/consumer-group/) | Event consumer groups for load-balanced delivery | `npx tsx examples/events/consumer-group/main.ts` |
| [multiple-subscribers](events/multiple-subscribers/) | Multiple handlers on same channel (fan-out) | `npx tsx examples/events/multiple-subscribers/main.ts` |
| [wildcard-subscription](events/wildcard-subscription/) | Wildcard channel patterns (`*` and `>`) | `npx tsx examples/events/wildcard-subscription/main.ts` |

---

## Events Store

Persistent events that can be replayed by subscribers, even after the events were published.

| Example | Description | Run |
|---------|-------------|-----|
| [persistent-pubsub](events-store/persistent-pubsub/) | `@EventStoreHandler` + `KubeMQRecord.asEventStore()` | `npx tsx examples/events-store/persistent-pubsub/main.ts` |
| [replay-from-sequence](events-store/replay-from-sequence/) | Subscribe from a specific sequence number | `npx tsx examples/events-store/replay-from-sequence/main.ts` |
| [replay-from-time](events-store/replay-from-time/) | Subscribe from a time delta (seconds ago) | `npx tsx examples/events-store/replay-from-time/main.ts` |
| [start-from-first](events-store/start-from-first/) | Replay all events from the beginning | `npx tsx examples/events-store/start-from-first/main.ts` |
| [start-from-last](events-store/start-from-last/) | Subscribe from last stored message | `npx tsx examples/events-store/start-from-last/main.ts` |
| [start-new-only](events-store/start-new-only/) | Subscribe to new messages only (ignore history) | `npx tsx examples/events-store/start-new-only/main.ts` |
| [consumer-group](events-store/consumer-group/) | Load-balanced persistent subscriptions via groups | `npx tsx examples/events-store/consumer-group/main.ts` |
| [cancel-subscription](events-store/cancel-subscription/) | Cancelling an event store subscription | `npx tsx examples/events-store/cancel-subscription/main.ts` |

---

## Queues

Pull-based messaging with acknowledgment, rejection, dead-letter queues, and delayed delivery.

| Example | Description | Run |
|---------|-------------|-----|
| [send-receive](queues/send-receive/) | `@QueueHandler` + `KubeMQRecord.asQueue()` for reliable delivery | `npx tsx examples/queues/send-receive/main.ts` |
| [ack-reject](queues/ack-reject/) | Manual `ctx.ack()`, `ctx.nack()`, and `ctx.reQueue()` | `npx tsx examples/queues/ack-reject/main.ts` |
| [dead-letter-queue](queues/dead-letter-queue/) | DLQ with `maxReceiveCount` and `maxReceiveQueue` | `npx tsx examples/queues/dead-letter-queue/main.ts` |
| [delayed-messages](queues/delayed-messages/) | Delayed message delivery with `delaySeconds` | `npx tsx examples/queues/delayed-messages/main.ts` |
| [peek-messages](queues/peek-messages/) | Peek at waiting messages without consuming | `npx tsx examples/queues/peek-messages/main.ts` |
| [batch-send](queues/batch-send/) | Batch sending multiple queue messages | `npx tsx examples/queues/batch-send/main.ts` |
| [ack-all](queues/ack-all/) | Bulk acknowledgment of all pending messages | `npx tsx examples/queues/ack-all/main.ts` |

---

## Queue Streams

Stream-based queue operations for high-throughput scenarios using the underlying kubemq-js stream API.

| Example | Description | Run |
|---------|-------------|-----|
| [stream-send](queues-stream/stream-send/) | High-throughput sending via gRPC stream | `npx tsx examples/queues-stream/stream-send/main.ts` |
| [stream-receive](queues-stream/stream-receive/) | Stream-based receiving with per-message ack/nack | `npx tsx examples/queues-stream/stream-receive/main.ts` |
| [delay-policy](queues-stream/delay-policy/) | Upstream send with delay policy on stream | `npx tsx examples/queues-stream/delay-policy/main.ts` |
| [dead-letter-policy](queues-stream/dead-letter-policy/) | Stream DLQ policy configuration | `npx tsx examples/queues-stream/dead-letter-policy/main.ts` |
| [expiration-policy](queues-stream/expiration-policy/) | Message expiration configuration | `npx tsx examples/queues-stream/expiration-policy/main.ts` |
| [requeue-all](queues-stream/requeue-all/) | Requeue all messages to target channel | `npx tsx examples/queues-stream/requeue-all/main.ts` |
| [nack-all](queues-stream/nack-all/) | Nack all messages in a batch | `npx tsx examples/queues-stream/nack-all/main.ts` |
| [ack-range](queues-stream/ack-range/) | Acknowledge specific sequence ranges | `npx tsx examples/queues-stream/ack-range/main.ts` |
| [auto-ack](queues-stream/auto-ack/) | Auto-acknowledgment mode via stream | `npx tsx examples/queues-stream/auto-ack/main.ts` |
| [poll-mode](queues-stream/poll-mode/) | Classic poll-based receive vs streaming | `npx tsx examples/queues-stream/poll-mode/main.ts` |

---

## RPC (Commands & Queries)

Request/reply patterns for synchronous communication between services.

| Example | Description | Run |
|---------|-------------|-----|
| [send-command](rpc/send-command/) | Send a command via `ClientProxy.send()` | `npx tsx examples/rpc/send-command/main.ts` |
| [handle-command](rpc/handle-command/) | `@CommandHandler` with response | `npx tsx examples/rpc/handle-command/main.ts` |
| [send-query](rpc/send-query/) | Send a query via `KubeMQRecord.asQuery()` | `npx tsx examples/rpc/send-query/main.ts` |
| [handle-query](rpc/handle-query/) | `@QueryHandler` with data response | `npx tsx examples/rpc/handle-query/main.ts` |
| [cached-query](rpc/cached-query/) | Query with server-side response caching | `npx tsx examples/rpc/cached-query/main.ts` |
| [query-cache-hit](rpc/query-cache-hit/) | Verifying cache hit behavior (send same query twice) | `npx tsx examples/rpc/query-cache-hit/main.ts` |
| [command-group](rpc/command-group/) | Command handler groups for load-balanced processing | `npx tsx examples/rpc/command-group/main.ts` |
| [query-group](rpc/query-group/) | Query handler groups for load-balanced processing | `npx tsx examples/rpc/query-group/main.ts` |
| [command-timeout](rpc/command-timeout/) | Command timeout handling when no handler responds | `npx tsx examples/rpc/command-timeout/main.ts` |

---

## Patterns

Common messaging patterns combining multiple features into real-world scenarios.

| Example | Description | Run |
|---------|-------------|-----|
| [fan-out](patterns/fan-out/) | Multiple event subscribers all receiving same messages | `npx tsx examples/patterns/fan-out/main.ts` |
| [request-reply](patterns/request-reply/) | Full command + query request-reply cycle | `npx tsx examples/patterns/request-reply/main.ts` |
| [work-queue](patterns/work-queue/) | Competing consumers on a queue (handlers in same group) | `npx tsx examples/patterns/work-queue/main.ts` |

---

## Management

Channel administration operations via `KubeMQClientProxy` wrapping kubemq-js management API.

| Example | Description | Run |
|---------|-------------|-----|
| [list-channels](management/list-channels/) | List channels by type (events, queues, commands, queries) | `npx tsx examples/management/list-channels/main.ts` |
| [create-channel](management/create-channel/) | Create a new channel | `npx tsx examples/management/create-channel/main.ts` |
| [delete-channel](management/delete-channel/) | Delete an existing channel | `npx tsx examples/management/delete-channel/main.ts` |
| [purge-queue](management/purge-queue/) | Purge all messages from a queue channel | `npx tsx examples/management/purge-queue/main.ts` |

---

## Observability

Logger integration bridging kubemq-js internal logs to NestJS Logger.

| Example | Description | Run |
|---------|-------------|-----|
| [logger-bridge-setup](observability/logger-bridge-setup/) | `createNestKubeMQLogger` bridge setup | `npx tsx examples/observability/logger-bridge-setup/main.ts` |

---

## Module Configuration

All `KubeMQModule` registration methods: static, async, testing, and multi-broker.

| Example | Description | Run |
|---------|-------------|-----|
| [for-root](module-config/for-root/) | `KubeMQModule.forRoot()` with static options | `npx tsx examples/module-config/for-root/main.ts` |
| [for-root-async](module-config/for-root-async/) | `KubeMQModule.forRootAsync()` with `ConfigService` | `npx tsx examples/module-config/for-root-async/main.ts` |
| [register](module-config/register/) | `KubeMQModule.register()` for named client proxy | `npx tsx examples/module-config/register/main.ts` |
| [register-async](module-config/register-async/) | `KubeMQModule.registerAsync()` with factory | `npx tsx examples/module-config/register-async/main.ts` |
| [for-test](module-config/for-test/) | `KubeMQModule.forTest()` with mock client and server | `npx tsx examples/module-config/for-test/main.ts` |
| [multi-broker](module-config/multi-broker/) | Multiple broker connections via separate `register()` calls | `npx tsx examples/module-config/multi-broker/main.ts` |

---

## Decorators

Handler decorator usage covering all five handler types, options, groups, and manual acknowledgment.

| Example | Description | Run |
|---------|-------------|-----|
| [all-handlers](decorators/all-handlers/) | All 5 decorators in one app (`@CommandHandler`, `@QueryHandler`, `@EventHandler`, `@EventStoreHandler`, `@QueueHandler`) | `npx tsx examples/decorators/all-handlers/main.ts` |
| [decorator-options](decorators/decorator-options/) | All decorator options: group, maxConcurrent, startFrom, manualAck | `npx tsx examples/decorators/decorator-options/main.ts` |
| [custom-groups](decorators/custom-groups/) | Consumer group configuration per handler type | `npx tsx examples/decorators/custom-groups/main.ts` |
| [manual-ack](decorators/manual-ack/) | Manual acknowledgment with `ctx.ack()` / `ctx.nack()` | `npx tsx examples/decorators/manual-ack/main.ts` |

---

## CQRS Bridge

NestJS CQRS module integration with KubeMQ as the transport layer.

| Example | Description | Run |
|---------|-------------|-----|
| [cqrs-commands](cqrs/cqrs-commands/) | CQRS command bus dispatching over KubeMQ | `npx tsx examples/cqrs/cqrs-commands/main.ts` |
| [cqrs-queries](cqrs/cqrs-queries/) | CQRS query bus dispatching over KubeMQ | `npx tsx examples/cqrs/cqrs-queries/main.ts` |
| [cqrs-events](cqrs/cqrs-events/) | CQRS event bus publishing over KubeMQ | `npx tsx examples/cqrs/cqrs-events/main.ts` |
| [full-cqrs-flow](cqrs/full-cqrs-flow/) | Complete CQRS flow: commands, queries, and events together | `npx tsx examples/cqrs/full-cqrs-flow/main.ts` |

---

## Testing

Unit and integration testing patterns with mock client and server — no real KubeMQ broker required.

| Example | Description | Run |
|---------|-------------|-----|
| [mock-client](testing/mock-client/) | `MockKubeMQClient` for testing services that send messages | `npx vitest run --config examples/vitest.config.ts testing/mock-client/mock-client.spec.ts` |
| [mock-server](testing/mock-server/) | `MockKubeMQServer` for testing message handlers | `npx vitest run --config examples/vitest.config.ts testing/mock-server/mock-server.spec.ts` |
| [unit-test-handlers](testing/unit-test-handlers/) | `TestingModule` + `CqrsModule` for handler unit tests | `npx vitest run --config examples/vitest.config.ts testing/unit-test-handlers/unit-test-handlers.spec.ts` |
| [integration-test](testing/integration-test/) | `KubeMQModule.forTest()` for full integration testing | `npx vitest run --config examples/vitest.config.ts testing/integration-test/integration-test.spec.ts` |

---

## Serialization

Custom serialization and deserialization for message payloads.

| Example | Description | Run |
|---------|-------------|-----|
| [custom-serializer](serialization/custom-serializer/) | Custom `Serializer` implementation for outbound messages | `npx tsx examples/serialization/custom-serializer/main.ts` |
| [custom-deserializer](serialization/custom-deserializer/) | Custom `Deserializer` implementation for inbound messages | `npx tsx examples/serialization/custom-deserializer/main.ts` |
| [msgpack-serializer](serialization/msgpack-serializer/) | MessagePack binary serialization for compact payloads | `npx tsx examples/serialization/msgpack-serializer/main.ts` |

---

## Health Check

Health check integration for monitoring KubeMQ connection status.

| Example | Description | Run |
|---------|-------------|-----|
| [basic-health](health-check/basic-health/) | Basic health endpoint exposing KubeMQ connection status | `npx tsx examples/health-check/basic-health/main.ts` |
| [terminus-integration](health-check/terminus-integration/) | `@nestjs/terminus` health indicator integration | `npx tsx examples/health-check/terminus-integration/main.ts` |

---

## Not Yet Demonstrated

The following features are documented in the root README but do not have runnable examples yet:

- **Multi-channel decorator arrays** — `@EventHandler(['channel-a', 'channel-b'])`
- **`verboseErrors` / `verboseHealth`** — Troubleshooting configuration options
- **OpenTelemetry integration** — `tracerProvider` / `meterProvider` options on `KubeMQServerOptions` / `KubeMQClientOptions`
