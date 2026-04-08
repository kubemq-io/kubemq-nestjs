# MessagePack Serializer

Demonstrates using `msgpackr` for compact binary serialization over KubeMQ, producing significantly smaller payloads than JSON.

## What This Demonstrates

- `MsgPackSerializer` implementing `KubeMQSerializer` with `msgpackr.pack()`
- `MsgPackDeserializer` implementing `KubeMQDeserializer` with `msgpackr.unpack()`
- Custom `contentType` tag (`application/msgpack`)
- Wiring serializer into client and deserializer into server
- Binary payload round-trip through KubeMQ

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)
- `msgpackr` installed: `npm install msgpackr`

## Run

```bash
npx tsx examples/serialization/msgpack-serializer/main.ts
```

## Expected Output

```
[MsgPackSerializerExample] KubeMQ microservice started (MsgPack serialization)
[EventService] Publishing event with MessagePack serializer...
[MsgPackHandler] Received (MessagePack decoded): {"message":"Hello from MessagePack","numbers":[1,2,3],"nested":{"key":"value"}}
[MsgPackHandler] Channel: nestjs-serialization.msgpack
[EventService] Event published (body was serialized as MessagePack binary)
```

## Key Code

**Serializer** — compact binary encoding:

```typescript
export class MsgPackSerializer implements KubeMQSerializer {
  readonly contentType = 'application/msgpack';
  serialize(value: unknown): Uint8Array {
    return pack(value === undefined ? null : value);
  }
}
```

**Deserializer** — binary decoding:

```typescript
export class MsgPackDeserializer implements KubeMQDeserializer {
  deserialize(data: Uint8Array): unknown {
    if (data.length === 0) return undefined;
    return unpack(Buffer.from(data));
  }
}
```
