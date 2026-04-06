import { DynamicModule, Module } from '@nestjs/common';
import { KubeMQModule, KubeMQServer } from '@kubemq/nestjs-transport';
import { AppController } from './app.controller';
import { OrderModule } from './order/order.module';
import { HealthModule } from './health/health.module';

@Module({})
export class AppModule {
  static forRoot(kubemqServer: KubeMQServer): DynamicModule {
    return {
      module: AppModule,
      imports: [
        KubeMQModule.forRoot({
          address: process.env.KUBEMQ_ADDRESS ?? 'localhost:50000',
          clientId: 'nestjs-example-global',
          isGlobal: true,
        }),
        OrderModule,
        HealthModule.register(kubemqServer),
      ],
      controllers: [AppController],
    };
  }
}
