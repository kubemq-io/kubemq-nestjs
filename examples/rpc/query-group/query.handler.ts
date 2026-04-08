import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, KubeMQQueryContext } from '@kubemq/nestjs-transport';

@Injectable()
export class QueryHandlerService {
  private readonly logger = new Logger('QueryHandler');
  private count = 0;

  @QueryHandler('nestjs-rpc.query-group', { group: 'nestjs-rpc-query-group' })
  async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
    this.count++;
    this.logger.log(
      `[group=nestjs-rpc-query-group] Query ${this.count} on ${ctx.channel}: ${JSON.stringify(data)}`,
    );
    return { seq: data.seq, lookup: data.lookup, available: 42, group: 'nestjs-rpc-query-group' };
  }
}
