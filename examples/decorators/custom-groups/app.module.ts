import { Module } from '@nestjs/common';
import { KubeMQModule } from '@kubemq/nestjs-transport';
import { BillingHandlerService } from './billing.handler.js';
import { ShippingHandlerService } from './shipping.handler.js';
import { AnalyticsHandlerService } from './analytics.handler.js';
import { SenderService } from './sender.service.js';

const address = process.env.KUBEMQ_ADDRESS ?? 'localhost:50000';

@Module({
  imports: [
    KubeMQModule.forRoot({
      address,
      clientId: 'nestjs-decorators-custom-groups-server',
      isGlobal: true,
    }),
    KubeMQModule.register({
      name: 'KUBEMQ_CLIENT',
      address,
      clientId: 'nestjs-decorators-custom-groups-client',
    }),
  ],
  providers: [
    BillingHandlerService,
    ShippingHandlerService,
    AnalyticsHandlerService,
    SenderService,
  ],
})
export class AppModule {}
