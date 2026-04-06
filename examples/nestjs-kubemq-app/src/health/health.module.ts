import { DynamicModule, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { KubeMQHealthIndicator, KubeMQServer } from '@kubemq/nestjs-transport';
import { HealthController } from './health.controller';

@Module({})
export class HealthModule {
  static register(kubemqServer: KubeMQServer): DynamicModule {
    return {
      module: HealthModule,
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: KubeMQHealthIndicator,
          useFactory: () => KubeMQHealthIndicator.fromServer(kubemqServer),
        },
      ],
    };
  }
}
