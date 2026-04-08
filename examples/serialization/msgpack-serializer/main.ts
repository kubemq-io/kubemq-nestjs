/**
 * Example: MessagePack Serializer
 *
 * Demonstrates using msgpackr for compact binary serialization over KubeMQ.
 * MessagePack produces significantly smaller payloads than JSON, improving
 * throughput for high-volume messaging.
 *
 * Prerequisites:
 *   - KubeMQ server running (default: localhost:50000, override with KUBEMQ_ADDRESS)
 *   - msgpackr installed: npm install msgpackr
 *
 * Run: npx tsx examples/serialization/msgpack-serializer/main.ts
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { MsgPackDeserializer } from './msgpack.deserializer.js';
import { AppModule } from './app.module.js';
import { EventService } from './event.service.js';

const logger = new Logger('MsgPackSerializerExample');
const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn'] });

  app.connectMicroservice({
    strategy: new KubeMQServer({
      address,
      clientId: 'nestjs-serialization-msgpack-server',
      deserializer: new MsgPackDeserializer(),
    }),
  });
  await app.startAllMicroservices();
  logger.log('KubeMQ microservice started (MsgPack serialization)');

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
// [MsgPackSerializerExample] KubeMQ microservice started (MsgPack serialization)
// [EventService] Publishing event with MessagePack serializer...
// [MsgPackHandler] Received (MessagePack decoded): {"message":"Hello from MessagePack","numbers":[1,2,3],"nested":{"key":"value"}}
// [MsgPackHandler] Channel: nestjs-serialization.msgpack
// [EventService] Event published (body was serialized as MessagePack binary)
