import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RequestReplyService {
  private readonly logger = new Logger(RequestReplyService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async run(): Promise<void> {
    await this.client.connect();

    this.logger.log('Sending command (request-reply)...');
    const cmdResult = await firstValueFrom(
      this.client.send('nestjs-patterns.request-reply.commands', {
        action: 'create-item',
        payload: 'item-data',
      }),
    );
    this.logger.log(`Command response: ${JSON.stringify(cmdResult)}`);

    this.logger.log('Sending query (request-reply)...');
    const queryResult = await firstValueFrom(
      this.client.send(
        'nestjs-patterns.request-reply.queries',
        new KubeMQRecord({ id: 'item-42' }).asQuery(),
      ),
    );
    this.logger.log(`Query response: ${JSON.stringify(queryResult)}`);
  }
}
