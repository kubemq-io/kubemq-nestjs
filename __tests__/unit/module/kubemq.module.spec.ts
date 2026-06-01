import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { KubeMQModule } from '../../../src/module/kubemq.module.js';
import { KUBEMQ_MODULE_OPTIONS, KUBEMQ_SDK_CLIENT } from '../../../src/constants.js';
import type { KubeMQFeatureOptionsFactory, KubeMQFeatureOptions, KubeMQClientOptionsFactory, KubeMQClientOptions } from '../../../src/interfaces/index.js';

describe('KubeMQModule', () => {
  // 16.108: forRoot() produces a valid dynamic module with correct providers
  it('forRoot() produces a valid dynamic module with correct providers', () => {
    const result = KubeMQModule.forRoot({
      address: 'localhost:50000',
      clientId: 'test-client',
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.global).toBe(true); // isGlobal defaults to true
    expect(result.providers).toBeDefined();
    expect(result.exports).toBeDefined();

    // Verify KUBEMQ_MODULE_OPTIONS provider exists
    const optionsProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === KUBEMQ_MODULE_OPTIONS,
    );
    expect(optionsProvider).toBeDefined();
    expect(optionsProvider.useValue.address).toBe('localhost:50000');
  });

  // 16.109: forRootAsync() with useFactory produces a valid dynamic module
  it('forRootAsync() with useFactory produces a valid dynamic module', () => {
    const result = KubeMQModule.forRootAsync({
      useFactory: () => ({
        address: 'localhost:50000',
        clientId: 'async-client',
      }),
      inject: [],
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.global).toBe(true);
    expect(result.providers).toBeDefined();
    expect(result.exports).toBeDefined();

    // Verify factory provider
    const factoryProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === KUBEMQ_MODULE_OPTIONS,
    );
    expect(factoryProvider).toBeDefined();
    expect(factoryProvider.useFactory).toBeInstanceOf(Function);
  });

  // 16.110: register() produces a valid dynamic module (client-only)
  it('register() produces a valid dynamic module (client-only)', () => {
    const clientName = 'KUBEMQ_SERVICE';
    const result = KubeMQModule.register({
      name: clientName,
      address: 'localhost:50000',
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.providers).toBeDefined();
    expect(result.exports).toBeDefined();

    // Verify the named client provider
    const clientProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === clientName,
    );
    expect(clientProvider).toBeDefined();
    expect(clientProvider.useFactory).toBeInstanceOf(Function);

    // Verify exports include the named client
    expect(result.exports).toContain(clientName);
  });

  // 16.111: registerAsync() with useFactory produces a valid dynamic module
  it('registerAsync() with useFactory produces a valid dynamic module', () => {
    const clientName = Symbol('KUBEMQ_ASYNC');
    const result = KubeMQModule.registerAsync({
      name: clientName,
      useFactory: () => ({
        address: 'localhost:50000',
      }),
      inject: [],
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.providers).toBeDefined();
    expect(result.exports).toBeDefined();

    // Verify the named async client provider
    const clientProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === clientName,
    );
    expect(clientProvider).toBeDefined();
    expect(clientProvider.useFactory).toBeInstanceOf(Function);

    // Verify exports include the named client
    expect(result.exports).toContain(clientName);
  });

  it('forFeature() returns DynamicModule with ScopedKubeMQClientProxy provider', () => {
    const result = KubeMQModule.forFeature({
      name: 'SVC',
      channelPrefix: 'orders.',
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain('SVC');

    const provider = (result.providers as any[])?.find((p: any) => p.provide === 'SVC');
    expect(provider).toBeDefined();
    expect(provider.useFactory).toBeInstanceOf(Function);
    expect(provider.inject).toContain(KUBEMQ_SDK_CLIENT);
  });

  it('forFeatureAsync() with useFactory returns DynamicModule', () => {
    const result = KubeMQModule.forFeatureAsync({
      name: 'SVC',
      useFactory: () => ({ name: 'SVC', channelPrefix: 'p.' }),
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain('SVC');

    const provider = (result.providers as any[])?.find((p: any) => p.provide === 'SVC');
    expect(provider).toBeDefined();
    expect(provider.useFactory).toBeInstanceOf(Function);
    expect(provider.inject).toContain(KUBEMQ_SDK_CLIENT);
  });

  it('forFeatureAsync() with useClass returns DynamicModule', () => {
    class TestFeatureFactory implements KubeMQFeatureOptionsFactory {
      createKubeMQFeatureOptions(): KubeMQFeatureOptions {
        return { name: 'SVC', channelPrefix: 'x.' };
      }
    }

    const result = KubeMQModule.forFeatureAsync({
      name: 'SVC',
      useClass: TestFeatureFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain('SVC');

    const provider = (result.providers as any[])?.find((p: any) => p.provide === 'SVC');
    expect(provider).toBeDefined();
    expect(provider.useFactory).toBeInstanceOf(Function);
  });

  it('forFeatureAsync() with useExisting returns DynamicModule', () => {
    class ExistingFactory implements KubeMQFeatureOptionsFactory {
      createKubeMQFeatureOptions(): KubeMQFeatureOptions {
        return { name: 'SVC', channelPrefix: 'e.' };
      }
    }

    const result = KubeMQModule.forFeatureAsync({
      name: 'SVC',
      useExisting: ExistingFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain('SVC');

    const provider = (result.providers as any[])?.find((p: any) => p.provide === 'SVC');
    expect(provider).toBeDefined();
    expect(provider.useFactory).toBeInstanceOf(Function);
  });

  it('forFeatureAsync() without useFactory/useClass/useExisting falls back to bare name', () => {
    const result = KubeMQModule.forFeatureAsync({
      name: 'SVC',
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain('SVC');
  });

  it('registerAsync() with useFactory returns DynamicModule with factory provider', () => {
    const name = 'REG_ASYNC_SVC';
    const result = KubeMQModule.registerAsync({
      name,
      useFactory: () => ({ address: 'localhost:50000' }),
      inject: [],
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain(name);

    const provider = (result.providers as any[])?.find((p: any) => p.provide === name);
    expect(provider).toBeDefined();
    expect(provider.useFactory).toBeInstanceOf(Function);
  });

  it('registerAsync() with useClass returns DynamicModule', () => {
    class TestClientFactory implements KubeMQClientOptionsFactory {
      createKubeMQClientOptions(): KubeMQClientOptions {
        return { address: 'localhost:50000' };
      }
    }

    const name = 'REG_CLASS_SVC';
    const result = KubeMQModule.registerAsync({
      name,
      useClass: TestClientFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain(name);

    const providers = result.providers as any[];
    const clientProvider = providers?.find((p: any) => p.provide === name);
    expect(clientProvider).toBeDefined();
    expect(clientProvider.useFactory).toBeInstanceOf(Function);
  });

  it('registerAsync() with useExisting returns DynamicModule', () => {
    class ExistingClientFactory implements KubeMQClientOptionsFactory {
      createKubeMQClientOptions(): KubeMQClientOptions {
        return { address: 'localhost:50000' };
      }
    }

    const name = 'REG_EXISTING_SVC';
    const result = KubeMQModule.registerAsync({
      name,
      useExisting: ExistingClientFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.exports).toContain(name);

    const provider = (result.providers as any[])?.find((p: any) => p.provide === name);
    expect(provider).toBeDefined();
    expect(provider.useFactory).toBeInstanceOf(Function);
  });

  it('registerAsync() without any option throws', () => {
    expect(() =>
      KubeMQModule.registerAsync({ name: 'SVC' } as any),
    ).toThrow('KubeMQModule.registerAsync() requires one of: useFactory, useClass, or useExisting');
  });

  it('forRootAsync() with useClass returns DynamicModule', () => {
    class TestOptionsFactory {
      createKubeMQOptions() {
        return { address: 'localhost:50000', clientId: 'test' };
      }
    }

    const result = KubeMQModule.forRootAsync({
      useClass: TestOptionsFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.global).toBe(true);
    expect(result.providers).toBeDefined();
  });

  it('forRootAsync() with useExisting returns DynamicModule', () => {
    class ExistingOptionsFactory {
      createKubeMQOptions() {
        return { address: 'localhost:50000', clientId: 'test' };
      }
    }

    const result = KubeMQModule.forRootAsync({
      useExisting: ExistingOptionsFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.global).toBe(true);
    expect(result.providers).toBeDefined();
  });

  it('forRootAsync() without any option throws', () => {
    expect(() =>
      KubeMQModule.forRootAsync({} as any),
    ).toThrow('KubeMQModule.forRootAsync() requires one of: useFactory, useClass, or useExisting');
  });
});
