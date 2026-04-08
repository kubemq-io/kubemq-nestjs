import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { UppercaseJsonSerializer } from './uppercase-json.serializer.js';
import { EventService } from './event.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-serialization-custom',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-serialization-custom-client',
      serializer: new UppercaseJsonSerializer(),
    }),
  ],
  providers: [EventService],
})
export class AppModule {}
