import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendCommand(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending command to handler...');
    const response = await firstValueFrom(
      this.client.send('nestjs-rpc.handle-command', {
        orderId: 'ORD-001',
        status: 'approved',
      }),
    );
    this.logger.log(`Handler response: ${JSON.stringify(response)}`);
  }
}
