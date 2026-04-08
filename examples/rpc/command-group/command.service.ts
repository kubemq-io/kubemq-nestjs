import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendCommands(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending 3 commands to group channel...');
    for (let i = 1; i <= 3; i++) {
      await firstValueFrom(
        this.client.send('nestjs-rpc.command-group', { seq: i, task: 'process' }),
      );
    }
    this.logger.log('All commands completed');
  }
}
