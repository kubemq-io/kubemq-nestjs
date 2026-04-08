import { Injectable, Logger } from '@nestjs/common';
import { QueueHandler, KubeMQQueueContext } from '@kubemq/nestjs-transport';

@Injectable()
export class WorkerHandler {
  private readonly logger = new Logger('Worker');

  @QueueHandler('nestjs-patterns.work-queue', {
    group: 'workers',
    maxMessages: 1,
    waitTimeoutSeconds: 30,
  })
  async handleJob(data: { jobId: number; task: string }, ctx: KubeMQQueueContext): Promise<void> {
    this.logger.log(
      `Processing job #${data.jobId} (task: ${data.task}) ` +
        `on ${ctx.channel} (seq: ${ctx.sequence}, deliveries: ${ctx.receiveCount})`,
    );
  }
}
