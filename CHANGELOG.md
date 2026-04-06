# Changelog

All notable changes to `@kubemq/nestjs-transport` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-05

### Added

- **KubeMQServer**: Custom transport strategy implementing `CustomTransportStrategy` for receiving Commands, Queries, Events, EventsStore, and Queue messages via `@MessagePattern` and `@EventPattern` decorators.
- **KubeMQClientProxy**: Client proxy extending `ClientProxy` for sending messages via `client.send()` and `client.emit()`.
- **KubeMQModule**: Dynamic module with `forRoot`, `forRootAsync`, `register`, and `registerAsync` static methods.
- **KubeMQRecord**: Record builder for specifying message type metadata (`.asQuery()`, `.asEventStore()`, `.asQueue()`).
- **Custom decorators**: `@CommandHandler`, `@QueryHandler`, `@EventHandler`, `@EventStoreHandler`, `@QueueHandler` with per-handler options.
- **Context hierarchy**: `KubeMQContext`, `KubeMQCommandContext`, `KubeMQQueryContext`, `KubeMQEventStoreContext`, `KubeMQQueueContext` with typed accessors for channel, id, sequence, ack/nack, and more.
- **KubeMQHealthIndicator**: Terminus-compatible health check using kubemq-js `ping()`.
- **KubeMQCqrsModule**: Bridge between `@nestjs/cqrs` CommandBus/QueryBus/EventBus and KubeMQ channels (via `@kubemq/nestjs-transport/cqrs`).
- **Testing utilities**: `MockKubeMQClient` and `MockKubeMQServer` for unit testing without a broker (via `@kubemq/nestjs-transport/testing`).
- **Serialization**: Pluggable `KubeMQSerializer` / `KubeMQDeserializer` interfaces with default JSON implementations.
- **Error mapping**: `mapErrorToRpcException` mapping kubemq-js errors to NestJS `RpcException` with HTTP-style status codes.
- **Logger bridge**: `createNestKubeMQLogger` bridging kubemq-js Logger to NestJS Logger.
- **ESM + CJS dual output** via tsup with three entry points (main, testing, cqrs).
- **Example app**: Full NestJS hybrid application demonstrating all 5 patterns, health checks, and module configuration.
