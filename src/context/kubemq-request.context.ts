// src/context/kubemq-request.context.ts
import { KubeMQContext } from './kubemq.context.js';

export class KubeMQRequestContext extends KubeMQContext {
  get fromClientId(): string {
    return this.getArgByIndex(0).fromClientId as string;
  }

  get replyChannel(): string {
    return this.getArgByIndex(0).replyChannel as string;
  }
}

// Re-exports for backward compatibility:
export { KubeMQRequestContext as KubeMQCommandContext };
export { KubeMQRequestContext as KubeMQQueryContext };
