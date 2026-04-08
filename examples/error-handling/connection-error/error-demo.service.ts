import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  KubeMQClientProxy,
  KubeMQRpcException,
  ConnectionNotReadyError,
  mapErrorToRpcException,
  type KubeMQRpcError,
} from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ErrorDemoService {
  private readonly logger = new Logger(ErrorDemoService.name);

  constructor(@Inject('KUBEMQ_SERVICE') private readonly client: KubeMQClientProxy) {}

  async demonstrateErrors(): Promise<void> {
    this.logger.log('Attempting to connect to invalid address...');

    try {
      await this.client.connect();
    } catch (err) {
      if (err instanceof ConnectionNotReadyError) {
        this.logger.log(`Caught ConnectionNotReadyError: ${err.message}`);
      } else {
        const error = err instanceof Error ? err : new Error(String(err));
        const rpcErr = mapErrorToRpcException(error, 'demo-channel', true);
        const detail = rpcErr.getError() as KubeMQRpcError;
        this.logger.log(
          `Caught KubeMQRpcException: statusCode=${detail.statusCode}, kubemqCode=${detail.kubemqCode}`,
        );
      }
    }

    try {
      await firstValueFrom(this.client.send('test-channel', { test: true }));
    } catch (err) {
      if (err instanceof KubeMQRpcException) {
        const error = err.getError() as KubeMQRpcError;
        this.logger.log(`RPC error: ${error.message} (code: ${error.kubemqCode})`);
      } else if (err instanceof ConnectionNotReadyError) {
        this.logger.log(`Caught ConnectionNotReadyError: ${err.message}`);
      } else {
        this.logger.error(
          'Unexpected error:',
          err instanceof Error ? err.message : String(err),
        );
      }
    }
  }
}
