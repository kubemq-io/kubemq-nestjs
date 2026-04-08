import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-connection-close-server',
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
