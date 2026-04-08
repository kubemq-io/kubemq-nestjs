import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KubeMQModule, type KubeMQModuleOptions } from '@kubemq/nestjs-transport';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KubeMQModule.forRootAsync({
      useFactory: (config: ConfigService): KubeMQModuleOptions => ({
        address: config.get('KUBEMQ_ADDRESS', 'localhost:50000'),
        clientId: 'nestjs-module-config-for-root-async-server',
        reconnect: { maxAttempts: -1, initialDelayMs: 1000, maxDelayMs: 30000, multiplier: 2, jitter: 'full' },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
