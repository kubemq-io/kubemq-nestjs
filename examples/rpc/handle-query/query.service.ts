import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendQuery(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending query...');
    const record = new KubeMQRecord({ productId: 'PROD-100' }).asQuery();
    const response = await firstValueFrom(
      this.client.send('nestjs-rpc.handle-query', record),
    );
    this.logger.log(`Query response: ${JSON.stringify(response)}`);
  }
}
