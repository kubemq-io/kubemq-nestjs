import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SenderService {
  private readonly logger = new Logger(SenderService.name);

  constructor(@Inject('KUBEMQ_SERVICE') private readonly client: KubeMQClientProxy) {}

  async sendEvent(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending event via async-registered KUBEMQ_SERVICE client...');
    await firstValueFrom(
      this.client.emit(
        'nestjs-module-config.register-async',
        new KubeMQRecord({ message: 'Hello from registerAsync()' }),
      ),
    );
    this.logger.log('Event sent successfully');
  }
}
