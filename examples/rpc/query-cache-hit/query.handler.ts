import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, KubeMQQueryContext } from '@kubemq/nestjs-transport';

@Injectable()
export class QueryHandlerService {
  private readonly logger = new Logger('QueryHandler');
  private invocationCount = 0;

  @QueryHandler('nestjs-rpc.query-cache-hit')
  async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
    this.invocationCount++;
    this.logger.log(`Processing query on ${ctx.channel}: ${JSON.stringify(data)}`);
    return {
      currency: data.currency,
      rate: 1.0,
      source: 'handler',
      timestamp: Date.now(),
      invocation: this.invocationCount,
    };
  }
}
