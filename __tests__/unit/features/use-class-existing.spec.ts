import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { Injectable } from '@nestjs/common';
import { KubeMQModule } from '../../../src/module/kubemq.module.js';
import { KUBEMQ_MODULE_OPTIONS } from '../../../src/constants.js';
import type { KubeMQOptionsFactory, KubeMQClientOptionsFactory } from '../../../src/interfaces/index.js';

@Injectable()
class TestKubeMQOptionsFactory implements KubeMQOptionsFactory {
  createKubeMQOptions() {
    return { address: 'localhost:50000', clientId: 'from-class' };
  }
}

@Injectable()
class TestKubeMQClientOptionsFactory implements KubeMQClientOptionsFactory {
  createKubeMQClientOptions() {
    return { address: 'localhost:50000', clientId: 'from-client-class' };
  }
}

describe('KubeMQModule.forRootAsync() — useClass / useExisting', () => {
  it('useClass creates options factory provider and KUBEMQ_MODULE_OPTIONS', () => {
    const result = KubeMQModule.forRootAsync({
      useClass: TestKubeMQOptionsFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    expect(result.global).toBe(true);
    expect(result.providers).toBeDefined();

    const providers = result.providers as any[];

    const classProvider = providers.find((p) => p.provide === TestKubeMQOptionsFactory);
    expect(classProvider).toBeDefined();
    expect(classProvider.useClass).toBe(TestKubeMQOptionsFactory);

    const optionsProvider = providers.find((p) => p.provide === KUBEMQ_MODULE_OPTIONS);
    expect(optionsProvider).toBeDefined();
    expect(optionsProvider.useFactory).toBeInstanceOf(Function);
    expect(optionsProvider.inject).toContain(TestKubeMQOptionsFactory);
  });

  it('useExisting creates KUBEMQ_MODULE_OPTIONS injecting existing provider', () => {
    const result = KubeMQModule.forRootAsync({
      useExisting: TestKubeMQOptionsFactory,
    });

    const providers = result.providers as any[];

    const classProvider = providers.find((p) => p.provide === TestKubeMQOptionsFactory);
    expect(classProvider).toBeUndefined();

    const optionsProvider = providers.find((p) => p.provide === KUBEMQ_MODULE_OPTIONS);
    expect(optionsProvider).toBeDefined();
    expect(optionsProvider.useFactory).toBeInstanceOf(Function);
    expect(optionsProvider.inject).toContain(TestKubeMQOptionsFactory);
  });

  it('useClass factory calls createKubeMQOptions()', async () => {
    const result = KubeMQModule.forRootAsync({
      useClass: TestKubeMQOptionsFactory,
    });

    const providers = result.providers as any[];
    const optionsProvider = providers.find((p) => p.provide === KUBEMQ_MODULE_OPTIONS);

    const factory = new TestKubeMQOptionsFactory();
    const options = await optionsProvider.useFactory(factory);

    expect(options.address).toBe('localhost:50000');
    expect(options.clientId).toBe('from-class');
  });

  it('useFactory still works (backward compatibility)', () => {
    const result = KubeMQModule.forRootAsync({
      useFactory: () => ({ address: 'localhost:50000' }),
      inject: [],
    });

    const providers = result.providers as any[];
    const optionsProvider = providers.find((p) => p.provide === KUBEMQ_MODULE_OPTIONS);
    expect(optionsProvider).toBeDefined();
    expect(optionsProvider.useFactory).toBeInstanceOf(Function);
  });

  it('throws when none of useFactory, useClass, useExisting is set', () => {
    expect(() => {
      KubeMQModule.forRootAsync({} as any);
    }).toThrow('requires one of: useFactory, useClass, or useExisting');
  });

  it('respects isGlobal: false with useClass', () => {
    const result = KubeMQModule.forRootAsync({
      isGlobal: false,
      useClass: TestKubeMQOptionsFactory,
    });
    expect(result.global).toBe(false);
  });
});

describe('KubeMQModule.registerAsync() — useClass / useExisting', () => {
  it('useClass creates client factory provider', () => {
    const name = 'KUBEMQ_SVC';
    const result = KubeMQModule.registerAsync({
      name,
      useClass: TestKubeMQClientOptionsFactory,
    });

    expect(result.module).toBe(KubeMQModule);
    const providers = result.providers as any[];

    const classProvider = providers.find((p) => p.provide === TestKubeMQClientOptionsFactory);
    expect(classProvider).toBeDefined();
    expect(classProvider.useClass).toBe(TestKubeMQClientOptionsFactory);

    const clientProvider = providers.find((p) => p.provide === name);
    expect(clientProvider).toBeDefined();
    expect(clientProvider.useFactory).toBeInstanceOf(Function);
    expect(clientProvider.inject).toContain(TestKubeMQClientOptionsFactory);

    expect(result.exports).toContain(name);
  });

  it('useExisting creates client provider injecting existing factory', () => {
    const name = Symbol('KUBEMQ_SVC');
    const result = KubeMQModule.registerAsync({
      name,
      useExisting: TestKubeMQClientOptionsFactory,
    });

    const providers = result.providers as any[];

    const classProvider = providers.find((p) => p.provide === TestKubeMQClientOptionsFactory);
    expect(classProvider).toBeUndefined();

    const clientProvider = providers.find((p) => p.provide === name);
    expect(clientProvider).toBeDefined();
    expect(clientProvider.inject).toContain(TestKubeMQClientOptionsFactory);
  });

  it('throws when none of useFactory, useClass, useExisting is set', () => {
    expect(() => {
      KubeMQModule.registerAsync({ name: 'SVC' } as any);
    }).toThrow('requires one of: useFactory, useClass, or useExisting');
  });

  it('useClass factory calls createKubeMQClientOptions() and returns KubeMQClientProxy', async () => {
    const name = 'KUBEMQ_CLASS_CLIENT';
    const result = KubeMQModule.registerAsync({
      name,
      useClass: TestKubeMQClientOptionsFactory,
    });

    const providers = result.providers as any[];
    const clientProvider = providers.find((p) => p.provide === name);
    expect(clientProvider).toBeDefined();

    const factory = new TestKubeMQClientOptionsFactory();
    const proxy = await clientProvider.useFactory(factory);
    expect(proxy).toBeDefined();
    expect(proxy.constructor.name).toBe('KubeMQClientProxy');
  });

  it('useExisting factory calls createKubeMQClientOptions() and returns KubeMQClientProxy', async () => {
    const name = 'KUBEMQ_EXISTING_CLIENT';
    const result = KubeMQModule.registerAsync({
      name,
      useExisting: TestKubeMQClientOptionsFactory,
    });

    const providers = result.providers as any[];
    const clientProvider = providers.find((p) => p.provide === name);
    expect(clientProvider).toBeDefined();

    const factory = new TestKubeMQClientOptionsFactory();
    const proxy = await clientProvider.useFactory(factory);
    expect(proxy).toBeDefined();
    expect(proxy.constructor.name).toBe('KubeMQClientProxy');
  });
});
