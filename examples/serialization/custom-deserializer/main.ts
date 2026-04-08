/**
 * Example: Custom Deserializer
 *
 * Demonstrates implementing the KubeMQDeserializer interface with a
 * validated JSON deserializer that enriches payloads with metadata
 * during deserialization. The deserializer uses tags for content-type
 * awareness.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *
 * Run: npx tsx examples/serialization/custom-deserializer/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { ValidatedJsonDeserializer } from './validated-json.deserializer.js';
import { AppModule } from './app.module.js';
import { EventService } from './event.service.js';

const logger = new Logger('CustomDeserializerExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-serialization-deser-server',
      deserializer: new ValidatedJsonDeserializer(),
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started (with ValidatedJsonDeserializer)');

  await new Promise((r) => setTimeout(r, 1500));

  const eventService = app.get(EventService);
  await eventService.publish();

  setTimeout(() => app.close().then(() => logger.log('Closed')).catch((err: unknown) => { logger.error('Shutdown error', err); process.exitCode = 1; }), 15_000).unref();
}

main().catch((err) => {
  logger.error('Fatal error', err);
  process.exit(1);
});

// Expected output:
// [CustomDeserializerExample] KubeMQ microservice started (with ValidatedJsonDeserializer)
// [EventService] Publishing event for custom deserializer...
// [DeserializerHandler] Received (deserialized): {"message":"Hello from custom deserializer example","value":42,"__deserializedAt":"..."}
// [DeserializerHandler] Channel: nestjs-serialization.custom-deserializer
// [EventService] Event published
