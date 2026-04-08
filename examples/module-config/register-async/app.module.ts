import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KubeMQModule, type KubeMQModuleOptions, type KubeMQClientOptions } from '@kubemq/nestjs-transport';
import { NotificationHandlerService } from './notification.handler.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    KubeMQModule.forRootAsync({
      useFactory: (config: ConfigService): KubeMQModuleOptions => ({
        address: config.get('KUBEMQ_ADDRESS', 'localhost:50000'),
        clientId: 'nestjs-module-config-register-async-server',
      }),
      inject: [ConfigService],
    }),
    KubeMQModule.registerAsync({
      name: 'NOTIFICATION_SERVICE',
      useFactory: (config: ConfigService): KubeMQClientOptions => ({
        address: config.get('KUBEMQ_ADDRESS', 'localhost:50000'),
        clientId: 'nestjs-module-config-register-async-client',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [NotificationHandlerService, NotificationService],
})
export class AppModule {}
