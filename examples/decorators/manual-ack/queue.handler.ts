import { Injectable, Logger } from '@nestjs/common';
import { QueueHandler, KubeMQQueueContext } from '@kubemq/nestjs-transport';

interface TaskMessage {
  taskId: string;
  type: string;
  priority: number;
}

@Injectable()
export class QueueHandlerService {
  private readonly logger = new Logger(QueueHandlerService.name);

  @QueueHandler('nestjs-decorators.manual-ack', { manualAck: true })
  async handleTask(data: TaskMessage, ctx: KubeMQQueueContext): Promise<void> {
    this.logger.log(
      `Received task ${data.taskId} (type=${data.type}, priority=${data.priority}) on ${ctx.channel}`,
    );

    if (data.type === 'valid') {
      ctx.ack();
      this.logger.log(`Task ${data.taskId} — ACK (processed successfully)`);
      return;
    }

    if (data.type === 'retry') {
      ctx.reQueue('nestjs-decorators.manual-ack-retry');
      this.logger.log(
        `Task ${data.taskId} — REQUEUE to nestjs-decorators.manual-ack-retry`,
      );
      return;
    }

    ctx.nack();
    this.logger.log(`Task ${data.taskId} — NACK (rejected)`);
  }
}
