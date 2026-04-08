# Custom Deserializer

Demonstrates implementing the `KubeMQDeserializer` interface with a validated JSON deserializer that enriches payloads with metadata during deserialization.

## What This Demonstrates

- Implementing the `KubeMQDeserializer` interface
- Using `tags` parameter for content-type awareness
- Enriching deserialized payloads with metadata
- Wiring a custom deserializer into `KubeMQServer`

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/serialization/custom-deserializer/main.ts
```

## Expected Output

```
[CustomDeserializerExample] KubeMQ microservice started (with ValidatedJsonDeserializer)
[EventService] Publishing event for custom deserializer...
[DeserializerHandler] Received (deserialized): {"message":"Hello from custom deserializer example","value":42,"__deserializedAt":"..."}
[DeserializerHandler] Channel: nestjs-serialization.custom-deserializer
[EventService] Event published
```

## Key Code

**Deserializer** — implements `KubeMQDeserializer`:

```typescript
export class ValidatedJsonDeserializer implements KubeMQDeserializer {
  deserialize(data: Uint8Array, tags?: Record<string, string>): unknown {
    const parsed = JSON.parse(decoder.decode(data));
    if (typeof parsed === 'object' && parsed !== null) {
      parsed.__deserializedAt = new Date().toISOString();
      if (tags?.['x-source']) parsed.__source = tags['x-source'];
    }
    return parsed;
  }
}
```

**Server** — wires deserializer:

```typescript
new KubeMQServer({
  address,
  deserializer: new ValidatedJsonDeserializer(),
})
```
