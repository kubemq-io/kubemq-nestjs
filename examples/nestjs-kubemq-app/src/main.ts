import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { KubeMQServer } from '@kubemq/nestjs-transport';
import { AppModule } from './app.module';

async function bootstrap() {
  const kubemqServer = new KubeMQServer({
    address: process.env.KUBEMQ_ADDRESS ?? 'localhost:50000',
    clientId: 'nestjs-example-server',
    group: 'example-group',
    defaultCommandTimeout: 10,
    defaultQueryTimeout: 10,
    eventsStore: {
      startFrom: 'new' as const,
    },
    queue: {
      maxMessages: 1,
      waitTimeoutSeconds: 30,
    },
  });

  const app = await NestFactory.create(AppModule.forRoot(kubemqServer));

  app.connectMicroservice({ strategy: kubemqServer });

  // Start all microservices, then HTTP
  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('HTTP server running on http://localhost:3000');
  console.log('KubeMQ microservice connected');
  console.log('Health check available at http://localhost:3000/health');
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
