import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendCachedQuery(): Promise<void> {
    await this.client.connect();
    this.logger.log('Sending query with cacheKey and cacheTtl...');
    const record = new KubeMQRecord({ configKey: 'app.settings' })
      .asQuery()
      .withMetadata({ cacheKey: 'config:app.settings', cacheTtl: 60 });
    const response = await firstValueFrom(
      this.client.send('nestjs-rpc.cached-query', record),
    );
    this.logger.log(`Query response: ${JSON.stringify(response)}`);
  }
}
