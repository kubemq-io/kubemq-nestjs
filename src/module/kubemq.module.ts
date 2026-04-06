import { DynamicModule, Module, Provider } from '@nestjs/common';
import { KUBEMQ_MODULE_OPTIONS } from '../constants.js';
import type {
  KubeMQModuleOptions,
  KubeMQOptionsFactory,
  KubeMQModuleAsyncOptions,
  KubeMQRegisterOptions,
  KubeMQClientOptionsFactory,
  KubeMQRegisterAsyncOptions,
  KubeMQClientOptions,
  KubeMQTestOptions,
} from '../interfaces/index.js';
import { KubeMQClientProxy } from '../client/kubemq-client.proxy.js';
import { MockKubeMQClient } from '../testing/mock-kubemq-client.js';
import { MockKubeMQServer } from '../testing/mock-kubemq-server.js';

@Module({})
export class KubeMQModule {
  static forRoot(options: KubeMQModuleOptions): DynamicModule {
    const isGlobal = options.isGlobal !== false;
    const providers: Provider[] = [
      {
        provide: KUBEMQ_MODULE_OPTIONS,
        useValue: options,
      },
    ];

    return {
      module: KubeMQModule,
      global: isGlobal,
      providers,
      exports: [KUBEMQ_MODULE_OPTIONS],
    };
  }

  static forRootAsync(options: KubeMQModuleAsyncOptions): DynamicModule {
    const isGlobal = options.isGlobal !== false;

    return {
      module: KubeMQModule,
      global: isGlobal,
      imports: options.imports ?? [],
      providers: KubeMQModule.createAsyncOptionsProvider(options),
      exports: [KUBEMQ_MODULE_OPTIONS],
    };
  }

  static register(options: KubeMQRegisterOptions): DynamicModule {
    const { name, ...clientOptions } = options;
    const providers: Provider[] = [
      {
        provide: name,
        useFactory: () => new KubeMQClientProxy(clientOptions),
      },
    ];

    return {
      module: KubeMQModule,
      providers,
      exports: [name],
    };
  }

  static registerAsync(options: KubeMQRegisterAsyncOptions): DynamicModule {
    return {
      module: KubeMQModule,
      imports: options.imports ?? [],
      providers: KubeMQModule.createAsyncClientProvider(options),
      exports: [options.name],
    };
  }

  static forTest(options?: KubeMQTestOptions): DynamicModule {
    const mockClient = new MockKubeMQClient();
    const mockServer = new MockKubeMQServer();
    const name = options?.name ?? 'KUBEMQ_SERVICE';

    return {
      module: KubeMQModule,
      global: options?.isGlobal !== false,
      providers: [
        { provide: KUBEMQ_MODULE_OPTIONS, useValue: { address: 'mock://localhost:50000' } },
        { provide: name, useValue: mockClient },
        { provide: MockKubeMQClient, useValue: mockClient },
        { provide: MockKubeMQServer, useValue: mockServer },
      ],
      exports: [KUBEMQ_MODULE_OPTIONS, name, MockKubeMQClient, MockKubeMQServer],
    };
  }

  private static createAsyncOptionsProvider(options: KubeMQModuleAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: KUBEMQ_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
      ];
    }
    if (options.useClass) {
      return [
        { provide: options.useClass, useClass: options.useClass },
        {
          provide: KUBEMQ_MODULE_OPTIONS,
          useFactory: (factory: KubeMQOptionsFactory) => factory.createKubeMQOptions(),
          inject: [options.useClass],
        },
      ];
    }
    if (options.useExisting) {
      return [
        {
          provide: KUBEMQ_MODULE_OPTIONS,
          useFactory: (factory: KubeMQOptionsFactory) => factory.createKubeMQOptions(),
          inject: [options.useExisting],
        },
      ];
    }
    throw new Error(
      'KubeMQModule.forRootAsync() requires one of: useFactory, useClass, or useExisting',
    );
  }

  private static createAsyncClientProvider(options: KubeMQRegisterAsyncOptions): Provider[] {
    if (options.useFactory) {
      return [
        {
          provide: options.name,
          useFactory: async (...args: any[]) => {
            const clientOptions = await (
              options.useFactory as (
                ...a: any[]
              ) => KubeMQClientOptions | Promise<KubeMQClientOptions>
            )(...args);
            return new KubeMQClientProxy(clientOptions);
          },
          inject: options.inject ?? [],
        },
      ];
    }
    if (options.useClass) {
      return [
        { provide: options.useClass, useClass: options.useClass },
        {
          provide: options.name,
          useFactory: async (factory: KubeMQClientOptionsFactory) => {
            const clientOptions = await factory.createKubeMQClientOptions();
            return new KubeMQClientProxy(clientOptions);
          },
          inject: [options.useClass],
        },
      ];
    }
    if (options.useExisting) {
      return [
        {
          provide: options.name,
          useFactory: async (factory: KubeMQClientOptionsFactory) => {
            const clientOptions = await factory.createKubeMQClientOptions();
            return new KubeMQClientProxy(clientOptions);
          },
          inject: [options.useExisting],
        },
      ];
    }
    throw new Error(
      'KubeMQModule.registerAsync() requires one of: useFactory, useClass, or useExisting',
    );
  }
}
