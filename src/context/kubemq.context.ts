import { BaseRpcContext } from '@nestjs/microservices';
import type { KubeMQPatternType } from '../constants.js';
import { TAG_CORRELATION_ID, TAG_CAUSATION_ID } from '../constants.js';

export class KubeMQContext extends BaseRpcContext<[Record<string, any>]> {
  get channel(): string {
    return this.getArgByIndex(0).channel as string;
  }

  get id(): string {
    return this.getArgByIndex(0).id as string;
  }

  get timestamp(): Date {
    return this.getArgByIndex(0).timestamp as Date;
  }

  get tags(): Record<string, string> {
    return this.getArgByIndex(0).tags as Record<string, string>;
  }

  get metadata(): string {
    return this.getArgByIndex(0).metadata as string;
  }

  get patternType(): KubeMQPatternType {
    return this.getArgByIndex(0).patternType as KubeMQPatternType;
  }

  getCorrelationId(): string | undefined {
    return this.tags?.[TAG_CORRELATION_ID];
  }

  getCausationId(): string | undefined {
    return this.tags?.[TAG_CAUSATION_ID];
  }
}
