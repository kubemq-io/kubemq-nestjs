import { KubeMQContext } from './kubemq.context.js';

export class KubeMQEventStoreContext extends KubeMQContext {
  /**
   * The sequence number of the event in the store.
   * Note: Proto uses uint64 but kubemq-js narrows to Number().
   * Precision may be lost for values > Number.MAX_SAFE_INTEGER.
   */
  get sequence(): number {
    return this.getArgByIndex(0).sequence as number;
  }
}
