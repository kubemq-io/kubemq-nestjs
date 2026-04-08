import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, KubeMQQueryContext } from '@kubemq/nestjs-transport';

@Injectable()
export class QueryHandlerService {
  private readonly logger = new Logger('QueryHandler');

  @QueryHandler('nestjs-rpc.send-query')
  async handle(data: Record<string, unknown>, ctx: KubeMQQueryContext) {
    this.logger.log(`Received query on ${ctx.channel}: ${JSON.stringify(data)}`);
    return {
      userId: data.userId,
      name: 'Alice',
      email: 'alice@example.com',
      role: 'admin',
    };
  }
}
