import { BaseRpcContext } from '@nestjs/microservices';
import type { KubeMQPatternType } from '../constants.js';

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
}
