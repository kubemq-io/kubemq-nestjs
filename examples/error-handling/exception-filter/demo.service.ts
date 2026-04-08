import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  KubeMQClientProxy,
  KubeMQRpcException,
  mapErrorToRpcException,
} from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(@Inject('KUBEMQ_SERVICE') private readonly client: KubeMQClientProxy) {}

  async sendCommand(): Promise<unknown> {
    await this.client.connect();
    try {
      return await firstValueFrom(
        this.client.send('nestjs-error-handling.exception-filter', { action: 'test' }),
      );
    } catch (err) {
      if (err instanceof KubeMQRpcException) {
        throw err;
      }
      const error = err instanceof Error ? err : new Error(String(err));
      throw mapErrorToRpcException(error, 'nestjs-error-handling.exception-filter', true);
    }
  }
}
