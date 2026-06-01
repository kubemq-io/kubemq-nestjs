import { Logger } from '@nestjs/common';
import { BackpressureOverflowError } from '../errors/backpressure-overflow.error.js';

interface QueuedItem {
  resolve: () => void;
  reject: (err: Error) => void;
}

export class BackpressureSemaphore {
  private running = 0;
  private readonly queue: QueuedItem[] = [];
  private readonly logger = new Logger('BackpressureSemaphore');

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueueDepth: number,
    private readonly channel: string,
  ) {}

  async acquire(isQueue: boolean): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }

    if (this.queue.length >= this.maxQueueDepth) {
      const err = new BackpressureOverflowError(this.channel, this.maxQueueDepth);
      this.logger.warn(err.message);
      if (isQueue) {
        throw err;
      }
      throw err;
    }

    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next.resolve();
    } else {
      this.running = Math.max(0, this.running - 1);
    }
  }

  get pending(): number {
    return this.queue.length;
  }

  get active(): number {
    return this.running;
  }
}
