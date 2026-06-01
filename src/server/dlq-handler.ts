import { Logger } from '@nestjs/common';
import type { KubeMQClient } from 'kubemq-js';
import { DeadLetterError } from '../errors/dlq.error.js';
import type { KubeMQServerEvents } from '../interfaces/kubemq-domain-events.interface.js';

export class DlqHandler {
  private readonly logger = new Logger('DlqHandler');
  private _dlqRoutedCount = 0;

  constructor(
    private readonly getClient: () => KubeMQClient | null,
    private readonly emitEvent: (event: 'deadLetter', payload: KubeMQServerEvents['deadLetter']) => void,
  ) {}

  get dlqRoutedCount(): number {
    return this._dlqRoutedCount;
  }

  async routeToDlq(params: {
    sourceChannel: string;
    dlqChannel: string;
    patternType: string;
    messageId: string;
    body: Uint8Array;
    metadata?: string;
    retryCount: number;
    error: Error;
  }): Promise<void> {
    const {
      sourceChannel, dlqChannel, patternType,
      messageId, body, metadata, retryCount, error,
    } = params;

    const dlqError = new DeadLetterError(sourceChannel, dlqChannel, retryCount, error);
    this.logger.warn(dlqError.message);

    const tags: Record<string, string> = {
      'x-dlq-source-channel': sourceChannel,
      'x-dlq-source-pattern-type': patternType,
      'x-dlq-source-id': messageId,
      'x-dlq-failure-reason': error.message,
      'x-dlq-retry-count': String(retryCount),
      'x-dlq-timestamp': new Date().toISOString(),
    };

    const eventPayload: KubeMQServerEvents['deadLetter'] = {
      channel: sourceChannel,
      dlqChannel,
      messageId,
      error: error.message,
      retryCount,
    };

    const client = this.getClient();
    if (!client) {
      const sendErr = 'KubeMQ client not connected — cannot send to DLQ';
      this.logger.error(sendErr);
      eventPayload.sendError = sendErr;
      this.emitEvent('deadLetter', eventPayload);
      return;
    }

    try {
      await client.sendQueueMessage({
        channel: dlqChannel,
        body,
        tags,
        metadata,
      });
      this._dlqRoutedCount++;
    } catch (sendError: unknown) {
      const msg = sendError instanceof Error ? sendError.message : String(sendError);
      this.logger.error(`Failed to send message to DLQ "${dlqChannel}": ${msg}`);
      eventPayload.sendError = msg;
    }

    this.emitEvent('deadLetter', eventPayload);
  }
}
