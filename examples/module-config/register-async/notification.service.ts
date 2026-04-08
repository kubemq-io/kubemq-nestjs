import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: KubeMQClientProxy,
  ) {}

  async sendNotification(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending notification via async-registered client...');
    const result = await firstValueFrom(
      this.client.send('nestjs-module-config.register-async', {
        to: 'user@example.com',
        subject: 'Welcome',
      }),
    );
    this.logger.log(`Notification response: ${JSON.stringify(result)}`);
  }
}
