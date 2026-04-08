import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  KubeMQClientProxy,
  KubeMQRecord,
  KubeMQRpcException,
} from '@kubemq/nestjs-transport';
import type { KubeMQRpcError } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CommandService {
  private readonly logger = new Logger(CommandService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendCommandWithTimeout(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending command with 2s timeout (no handler will respond)...');

    try {
      const record = new KubeMQRecord({ task: 'unreachable' }).withMetadata({ timeout: 2 });
      await firstValueFrom(
        this.client.send('nestjs-rpc.command-timeout', record),
      );
      this.logger.warn('Command succeeded unexpectedly');
    } catch (err) {
      if (err instanceof KubeMQRpcException) {
        const error = err.getError() as KubeMQRpcError;
        this.logger.log('Caught expected timeout error:');
        this.logger.log(`  statusCode: ${error.statusCode}`);
        this.logger.log(`  message: ${error.message}`);
        this.logger.log(`  kubemqCode: ${error.kubemqCode}`);
        this.logger.log('Timeout handling completed successfully');
      } else {
        this.logger.error(`Unexpected error type: ${err}`);
      }
    }
  }
}
