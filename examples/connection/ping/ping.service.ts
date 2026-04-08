import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy } from '@kubemq/nestjs-transport';
import type { KubeMQClient } from 'kubemq-js';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);

  constructor(@Inject('KUBEMQ_SERVICE') private readonly client: KubeMQClientProxy) {}

  async ping(): Promise<void> {
    await this.client.connect();
    this.logger.log('Pinging KubeMQ broker...');

    const kubemqClient = this.client.unwrap<KubeMQClient>();
    const info = await kubemqClient.ping();

    this.logger.log(`Server host: ${info.host}`);
    this.logger.log(`Server version: ${info.version}`);
    this.logger.log(`Server uptime: ${info.serverUpTime}`);
  }
}
