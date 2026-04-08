import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, KubeMQQueryContext } from '@kubemq/nestjs-transport';

@Injectable()
export class QueryHandlerService {
  private readonly logger = new Logger('QueryHandler');

  @QueryHandler('nestjs-rpc.cached-query')
  async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
    this.logger.log(`Processing query on ${ctx.channel}: ${JSON.stringify(data)}`);
    return {
      configKey: data.configKey,
      value: 'production',
      version: 1,
      cached: false,
    };
  }
}
