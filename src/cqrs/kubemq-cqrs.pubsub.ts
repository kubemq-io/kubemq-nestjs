import { Injectable, Inject, Optional, type OnModuleDestroy } from '@nestjs/common';
import { KubeMQClient as KubeMQSDKClient } from 'kubemq-js';
import type { KubeMQCqrsOptions } from './interfaces.js';
import { serializeBody, deserializeBody } from '../serialization/helpers.js';
import { TAG_CONTENT_TYPE } from '../constants.js';

function resolveChannelSegment(message: object, options?: KubeMQCqrsOptions): string {
  if (options?.channelResolver) {
    return options.channelResolver(message);
  }
  const ctor = (message as { constructor?: { name?: string } }).constructor;
  return ctor?.name && ctor.name !== 'Object' ? ctor.name : 'unknown';
}

abstract class KubeMQCqrsPubSubBase implements OnModuleDestroy {
  protected client: KubeMQSDKClient | null = null;

  constructor(
    protected readonly kind: 'command' | 'query' | 'event',
    @Optional() @Inject('KUBEMQ_CQRS_OPTIONS') protected readonly cqrsOptions?: KubeMQCqrsOptions,
  ) {}

  setClient(client: KubeMQSDKClient): void {
    this.client = client;
  }

  protected getClient(): KubeMQSDKClient {
    if (!this.client) {
      throw new Error('CQRS client not initialized. Ensure KubeMQCqrsModule is imported.');
    }
    return this.client;
  }

  protected buildTags(extra: Record<string, string>): Record<string, string> {
    const tags: Record<string, string> = {
      'nestjs:type': `cqrs-${this.kind}`,
      ...extra,
    };
    const ct = this.cqrsOptions?.serializer?.contentType;
    if (ct) {
      tags[TAG_CONTENT_TYPE] = ct;
    }
    return tags;
  }

  async onModuleDestroy(): Promise<void> {
    /* shared client closed by KubeMQCqrsModule */
  }
}

@Injectable()
export class KubeMQCommandPubSub extends KubeMQCqrsPubSubBase {
  private readonly prefix: string;
  private readonly timeout: number;

  constructor(@Optional() @Inject('KUBEMQ_CQRS_OPTIONS') cqrsOptions?: KubeMQCqrsOptions) {
    super('command', cqrsOptions);
    this.prefix = cqrsOptions?.commandChannelPrefix ?? 'cqrs.commands';
    this.timeout = cqrsOptions?.commandTimeout ?? 10;
  }

  /** Nest CommandBus publisher contract: single argument. */
  async publish(message: object): Promise<unknown> {
    const client = this.getClient();
    const segment = resolveChannelSegment(message, this.cqrsOptions);
    const fullChannel = `${this.prefix}.${segment}`;
    const body = serializeBody(message, this.cqrsOptions?.serializer);
    const tags = this.buildTags({});

    const response = await client.sendCommand({
      channel: fullChannel,
      body,
      timeoutInSeconds: this.timeout,
      tags,
    });

    if (!response.executed) {
      throw new Error(
        `CQRS command failed on ${fullChannel}: ${response.error ?? 'unknown error'}`,
      );
    }

    return response.body
      ? deserializeBody(response.body, response.tags, this.cqrsOptions?.deserializer)
      : undefined;
  }
}

@Injectable()
export class KubeMQQueryPubSub extends KubeMQCqrsPubSubBase {
  private readonly prefix: string;
  private readonly timeout: number;

  constructor(@Optional() @Inject('KUBEMQ_CQRS_OPTIONS') cqrsOptions?: KubeMQCqrsOptions) {
    super('query', cqrsOptions);
    this.prefix = cqrsOptions?.queryChannelPrefix ?? 'cqrs.queries';
    this.timeout = cqrsOptions?.queryTimeout ?? 10;
  }

  /** Nest QueryBus publisher contract: single argument. */
  async publish(message: object): Promise<unknown> {
    const client = this.getClient();
    const segment = resolveChannelSegment(message, this.cqrsOptions);
    const fullChannel = `${this.prefix}.${segment}`;
    const body = serializeBody(message, this.cqrsOptions?.serializer);
    const tags = this.buildTags({});

    const response = await client.sendQuery({
      channel: fullChannel,
      body,
      timeoutInSeconds: this.timeout,
      tags,
    });

    if (!response.executed) {
      throw new Error(`CQRS query failed on ${fullChannel}: ${response.error ?? 'unknown error'}`);
    }

    return response.body
      ? deserializeBody(response.body, response.tags, this.cqrsOptions?.deserializer)
      : undefined;
  }
}

@Injectable()
export class KubeMQEventPubSub extends KubeMQCqrsPubSubBase {
  private readonly prefix: string;
  private readonly persistEvents: boolean;

  constructor(@Optional() @Inject('KUBEMQ_CQRS_OPTIONS') cqrsOptions?: KubeMQCqrsOptions) {
    super('event', cqrsOptions);
    this.prefix = cqrsOptions?.eventChannelPrefix ?? 'cqrs.events';
    this.persistEvents = cqrsOptions?.persistEvents ?? false;
  }

  /** Nest EventBus publisher contract: single argument. */
  async publish(message: object): Promise<void> {
    const client = this.getClient();
    const segment = resolveChannelSegment(message, this.cqrsOptions);
    const fullChannel = `${this.prefix}.${segment}`;
    const body = serializeBody(message, this.cqrsOptions?.serializer);
    const tags = this.buildTags({});

    if (this.persistEvents) {
      await client.sendEventStore({
        channel: fullChannel,
        body,
        tags,
      });
    } else {
      await client.sendEvent({
        channel: fullChannel,
        body,
        tags,
      });
    }
  }
}
