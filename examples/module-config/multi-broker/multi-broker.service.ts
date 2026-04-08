import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MultiBrokerService {
  private readonly logger = new Logger(MultiBrokerService.name);

  constructor(
    @Inject('PRIMARY_BROKER') private readonly primary: KubeMQClientProxy,
    @Inject('SECONDARY_BROKER') private readonly secondary: KubeMQClientProxy,
  ) {}

  async sendToPrimary(): Promise<void> {
    await this.primary.connect();
    this.logger.log('Sending event to primary broker...');
    await firstValueFrom(
      this.primary.emit('nestjs-module-config.multi-broker-primary', {
        source: 'primary',
        message: 'Hello from primary broker',
      }),
    );
    this.logger.log('Event sent to primary broker');
  }

  async sendToSecondary(): Promise<void> {
    await this.secondary.connect();
    this.logger.log('Sending event to secondary broker...');
    await firstValueFrom(
      this.secondary.emit('nestjs-module-config.multi-broker-secondary', {
        source: 'secondary',
        message: 'Hello from secondary broker',
      }),
    );
    this.logger.log('Event sent to secondary broker');
  }
}
