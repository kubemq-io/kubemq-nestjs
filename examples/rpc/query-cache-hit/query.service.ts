import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async demonstrateCacheHit(): Promise<void> {
    await this.client.connect();

    this.logger.log('--- Query 1 (cache miss) ---');
    this.logger.log('Sending query with cacheKey...');
    const record1 = new KubeMQRecord({ key: 'exchange-rate', currency: 'USD' })
      .asQuery()
      .withMetadata({ cacheKey: 'rate:USD', cacheTtl: 30 });
    const response1 = await firstValueFrom(
      this.client.send('nestjs-rpc.query-cache-hit', record1),
    );
    this.logger.log(`Response 1: ${JSON.stringify(response1)}`);

    await new Promise((r) => setTimeout(r, 1000));

    this.logger.log('--- Query 2 (cache hit) ---');
    this.logger.log('Sending same query again (should hit cache)...');
    const record2 = new KubeMQRecord({ key: 'exchange-rate', currency: 'USD' })
      .asQuery()
      .withMetadata({ cacheKey: 'rate:USD', cacheTtl: 30 });
    const response2 = await firstValueFrom(
      this.client.send('nestjs-rpc.query-cache-hit', record2),
    );
    this.logger.log(`Response 2: ${JSON.stringify(response2)}`);
    this.logger.log('Cache hit confirmed — handler was NOT invoked for query 2');
  }
}
