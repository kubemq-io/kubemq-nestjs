import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SenderService {
  private readonly logger = new Logger(SenderService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async sendTasks(): Promise<void> {
    await this.client.connect();

    const tasks = [
      { taskId: 'T-001', type: 'valid', priority: 1 },
      { taskId: 'T-002', type: 'invalid', priority: 2 },
      { taskId: 'T-003', type: 'retry', priority: 3 },
    ];

    for (const task of tasks) {
      this.logger.log(`Sending task ${task.taskId} (type=${task.type})...`);
      await firstValueFrom(
        this.client.emit(
          'nestjs-decorators.manual-ack',
          new KubeMQRecord(task).asQueue(),
        ),
      );
      await new Promise((r) => setTimeout(r, 500));
    }

    this.logger.log('All tasks sent');
  }
}
