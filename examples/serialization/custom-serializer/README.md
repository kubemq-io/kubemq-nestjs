# Custom Serializer

Demonstrates implementing the `KubeMQSerializer` interface with a custom uppercase JSON serializer.

## What This Demonstrates

- Implementing the `KubeMQSerializer` interface
- Setting `contentType` for content-type tagging
- Wiring a custom serializer into `KubeMQModule.register()`
- Verifying serialized data flows through KubeMQ

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/serialization/custom-serializer/main.ts
```

## Expected Output

```
[CustomSerializerExample] KubeMQ microservice started
[EventService] Publishing event with custom serializer...
[EventService] Event published (body was serialized as uppercase JSON)
```

## Key Code

**Serializer** — implements `KubeMQSerializer`:

```typescript
export class UppercaseJsonSerializer implements KubeMQSerializer {
  readonly contentType = 'application/json+uppercase';

  serialize(value: unknown): Uint8Array {
    const json = JSON.stringify(value === undefined ? null : value);
    return encoder.encode(json.toUpperCase());
  }
}
```

**Module** — wires serializer into client:

```typescript
KubeMQModule.register({
  name: 'KUBEMQ_CLIENT',
  address,
  serializer: new UppercaseJsonSerializer(),
})
```
