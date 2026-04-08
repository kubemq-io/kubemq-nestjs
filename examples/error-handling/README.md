# Error Handling Examples

Examples demonstrating error handling patterns with `@kubemq/nestjs-transport`.

## Known Limitations

These examples cover the most common error handling scenarios. The following patterns are not yet demonstrated:

- **RPC exception filters for microservice-only apps** — The exception-filter example uses HTTP context. For microservice-only apps, use `RpcExceptionFilter` and register with `useGlobalFilters()` on the microservice instance.
- **Handler throw demonstration** — No handler example currently throws an error to show how the transport converts handler failures to `executed: false` with a string error on the wire.
- **Event/event-store/queue handler errors** — These handler types catch errors internally and log them. They do not propagate through Nest's exception filter pipeline (only command/query handlers do).
- **Client-side retry** — The reconnection example covers server-side reconnection. For client-side retry, configure the `retry` option in `KubeMQModule.register()` or `KubeMQClientOptions`.
