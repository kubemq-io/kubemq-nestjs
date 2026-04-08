import { Injectable, Inject, Logger } from '@nestjs/common';
import { KubeMQClientProxy, KubeMQRecord } from '@kubemq/nestjs-transport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(@Inject('KUBEMQ_CLIENT') private readonly client: KubeMQClientProxy) {}

  async enqueueJobs(): Promise<void> {
    await this.client.connect();

    const tasks = ['resize-image', 'send-email', 'generate-report'];
    for (let i = 0; i < tasks.length; i++) {
      const job = { jobId: i + 1, task: tasks[i] };
      this.logger.log(`Enqueuing job #${job.jobId}: ${job.task}`);
      await firstValueFrom(
        this.client.emit(
          'nestjs-patterns.work-queue',
          new KubeMQRecord(job).asQueue(),
        ),
      );
    }
    this.logger.log(`Enqueued ${tasks.length} jobs`);
  }
}
