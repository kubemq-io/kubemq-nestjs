import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendQueries(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending 3 queries to group channel...');
    for (let i = 1; i <= 3; i++) {
      const record = new KubeMQRecord({ seq: i, lookup: 'inventory' }).asQuery();
      const response = await firstValueFrom(
        this.client.send('nestjs-rpc.query-group', record),
      );
      this.logger.log(`Query ${i} response: ${JSON.stringify(response)}`);
    }
    this.logger.log('All queries completed');
  }
}
