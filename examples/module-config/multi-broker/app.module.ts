import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { MultiBrokerHandlerService } from './multi-broker.handler.js';
import { MultiBrokerService } from './multi-broker.service.js';

const primaryAddress = process.env.KUBEMQ_PRIMARY_ADDRESS ?? 'localhost:50000';
const secondaryAddress = process.env.KUBEMQ_SECONDARY_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address: primaryAddress,
      clientId: 'nestjs-module-config-multi-broker-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'PRIMARY_BROKER',
      address: primaryAddress,
      clientId: 'nestjs-module-config-multi-broker-primary',
    }),
    KubeMQModule.register({
      name: 'SECONDARY_BROKER',
      address: secondaryAddress,
      clientId: 'nestjs-module-config-multi-broker-secondary',
    }),
  ],
  providers: [MultiBrokerHandlerService, MultiBrokerService],
})
export class AppModule {}
