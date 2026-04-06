import { DynamicModule, Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { KubeMQClient as KubeMQSDKClient } from 'kubemq-js';
import type { KubeMQCqrsOptions, KubeMQCqrsAsyncOptions } from './interfaces.js';
import {
  KubeMQCommandPubSub,
  KubeMQQueryPubSub,
  KubeMQEventPubSub,
} from './kubemq-cqrs.pubsub.js';
import { KUBEMQ_MODULE_OPTIONS } from '../constants.js';
import type { KubeMQModuleOptions } from '../interfaces/index.js';
import { createNestKubeMQLogger } from '../observability/logger-bridge.js';
import { isModuleNotFoundError } from '../utils/error-helpers.js';

@Module({})
export class KubeMQCqrsModule implements OnModuleInit, OnModuleDestroy {
  private sharedClient: KubeMQSDKClient | null = null;

  constructor(private readonly moduleRef: ModuleRef) {}

  static forRoot(options?: KubeMQCqrsOptions): DynamicModule {
    return {
      module: KubeMQCqrsModule,
      providers: [
        { provide: 'KUBEMQ_CQRS_OPTIONS', useValue: options ?? {} },
        KubeMQCommandPubSub,
        KubeMQQueryPubSub,
        KubeMQEventPubSub,
      ],
      exports: [KubeMQCommandPubSub, KubeMQQueryPubSub, KubeMQEventPubSub],
    };
  }

  static forRootAsync(options: KubeMQCqrsAsyncOptions): DynamicModule {
    return {
      module: KubeMQCqrsModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: 'KUBEMQ_CQRS_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        KubeMQCommandPubSub,
        KubeMQQueryPubSub,
        KubeMQEventPubSub,
      ],
      exports: [KubeMQCommandPubSub, KubeMQQueryPubSub, KubeMQEventPubSub],
    };
  }

  async onModuleInit(): Promise<void> {
    const kubemqOptions = this.moduleRef.get<KubeMQModuleOptions>(KUBEMQ_MODULE_OPTIONS, {
      strict: false,
    });
    if (!kubemqOptions?.address) {
      throw new Error(
        'KubeMQCqrsModule requires KubeMQModule.forRoot() / forRootAsync() so KUBEMQ_MODULE_OPTIONS is registered with a broker address.',
      );
    }

    this.sharedClient = await KubeMQSDKClient.create({
      address: kubemqOptions.address,
      clientId: kubemqOptions.clientId ? `${kubemqOptions.clientId}-cqrs` : undefined,
      credentials: kubemqOptions.credentials,
      tls: kubemqOptions.tls,
      retry: kubemqOptions.retry,
      reconnect: kubemqOptions.reconnect,
      keepalive: kubemqOptions.keepalive,
      logger: createNestKubeMQLogger('KubeMQCqrs'),
      tracerProvider: kubemqOptions.tracerProvider,
      meterProvider: kubemqOptions.meterProvider,
    });

    try {
      const commandPubSub = this.moduleRef.get(KubeMQCommandPubSub, { strict: false });
      const queryPubSub = this.moduleRef.get(KubeMQQueryPubSub, { strict: false });
      const eventPubSub = this.moduleRef.get(KubeMQEventPubSub, { strict: false });

      if (!commandPubSub || !queryPubSub || !eventPubSub) {
        throw new Error('KubeMQCqrsModule failed to resolve CQRS pubsub providers.');
      }

      commandPubSub.setClient(this.sharedClient);
      queryPubSub.setClient(this.sharedClient);
      eventPubSub.setClient(this.sharedClient);

      try {
        const { CommandBus, QueryBus, EventBus } = await import('@nestjs/cqrs');
        const commandBus = this.moduleRef.get(CommandBus, { strict: false });
        const queryBus = this.moduleRef.get(QueryBus, { strict: false });
        const eventBus = this.moduleRef.get(EventBus, { strict: false });

        if (!commandBus || !queryBus || !eventBus) {
          throw new Error(
            'KubeMQCqrsModule requires CqrsModule to be imported and CommandBus, QueryBus, EventBus to be available.',
          );
        }

        commandBus.publisher = commandPubSub;
        queryBus.publisher = queryPubSub;
        eventBus.publisher = eventPubSub;
      } catch (e: unknown) {
        if (isModuleNotFoundError(e)) {
          return;
        }
        throw e;
      }
    } catch (err) {
      if (this.sharedClient) {
        try {
          await this.sharedClient.close({ timeoutSeconds: 5 });
        } catch {
          /* swallow */
        }
        this.sharedClient = null;
      }
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.sharedClient) {
      let drainTimeout = 5;
      try {
        const cqrsOptions = this.moduleRef.get<KubeMQCqrsOptions>('KUBEMQ_CQRS_OPTIONS', {
          strict: false,
        });
        drainTimeout = cqrsOptions?.drainTimeoutSeconds ?? 5;
      } catch {
        /* use default */
      }
      await this.sharedClient.close({ timeoutSeconds: drainTimeout });
      this.sharedClient = null;
    }
  }
}
