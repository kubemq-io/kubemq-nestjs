import { DynamicModule, Module, Provider } from '@nestjs/common';
import { KUBEMQ_MODULE_OPTIONS, KUBEMQ_SDK_CLIENT } from '../constants.js';
import type {
  KubeMQModuleOptions,
  KubeMQOptionsFactory,
  KubeMQModuleAsyncOptions,
  KubeMQRegisterOptions,
  KubeMQClientOptionsFactory,
  KubeMQRegisterAsyncOptions,
  KubeMQClientOptions,
  KubeMQTestOptions,
  KubeMQFeatureOptions,
  KubeMQFeatureAsyncOptions,
  KubeMQFeatureOptionsFactory,
} from '../interfaces/index.js';
import { KubeMQClientProxy } from '../client/kubemq-client.proxy.js';
import { ScopedKubeMQClientProxy } from '../client/scoped-kubemq-client.proxy.js';
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
      {
        provide: KUBEMQ_SDK_CLIENT,
        useFactory: () => new KubeMQClientProxy(options),
      },
    ];

    return {
      module: KubeMQModule,
      global: isGlobal,
      providers,
      exports: [KUBEMQ_MODULE_OPTIONS, KUBEMQ_SDK_CLIENT],
    };
  }

  static forRootAsync(options: KubeMQModuleAsyncOptions): DynamicModule {
    const isGlobal = options.isGlobal !== false;
    const asyncProviders = KubeMQModule.createAsyncOptionsProvider(options);

    return {
      module: KubeMQModule,
      global: isGlobal,
      imports: options.imports ?? [],
      providers: [
        ...asyncProviders,
        {
          provide: KUBEMQ_SDK_CLIENT,
          useFactory: (moduleOptions: KubeMQModuleOptions) => new KubeMQClientProxy(moduleOptions),
          inject: [KUBEMQ_MODULE_OPTIONS],
        },
      ],
      exports: [KUBEMQ_MODULE_OPTIONS, KUBEMQ_SDK_CLIENT],
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
        { provide: KUBEMQ_SDK_CLIENT, useValue: mockClient },
        { provide: MockKubeMQClient, useValue: mockClient },
        { provide: MockKubeMQServer, useValue: mockServer },
      ],
      exports: [KUBEMQ_MODULE_OPTIONS, KUBEMQ_SDK_CLIENT, name, MockKubeMQClient, MockKubeMQServer],
    };
  }

  static forFeature(options: KubeMQFeatureOptions): DynamicModule {
    return {
      module: KubeMQModule,
      providers: [
        {
          provide: options.name,
          useFactory: (sharedClient: KubeMQClientProxy) =>
            new ScopedKubeMQClientProxy(sharedClient, options.channelPrefix),
          inject: [KUBEMQ_SDK_CLIENT],
        },
      ],
      exports: [options.name],
    };
  }

  static forFeatureAsync(options: KubeMQFeatureAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: options.name,
        useFactory: async (sharedClient: KubeMQClientProxy, ...args: any[]) => {
          let featureOptions: KubeMQFeatureOptions;

          if (options.useFactory) {
            featureOptions = await options.useFactory(...args);
          } else if (options.useClass) {
            const factory = new options.useClass();
            featureOptions = await factory.createKubeMQFeatureOptions();
          } else if (options.useExisting) {
            const factory = args[0] as KubeMQFeatureOptionsFactory;
            featureOptions = await factory.createKubeMQFeatureOptions();
          } else {
            featureOptions = { name: options.name };
          }

          return new ScopedKubeMQClientProxy(sharedClient, featureOptions.channelPrefix);
        },
        inject: [KUBEMQ_SDK_CLIENT, ...(options.inject ?? [])],
      },
    ];

    return {
      module: KubeMQModule,
      imports: options.imports ?? [],
      providers,
      exports: [options.name],
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
