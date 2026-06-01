import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/client/kubemq-client.proxy.js', () => ({
  KubeMQClientProxy: vi.fn().mockImplementation((opts: any) => ({ __proxy: true, opts })),
}));
vi.mock('../../../src/client/scoped-kubemq-client.proxy.js', () => ({
  ScopedKubeMQClientProxy: vi
    .fn()
    .mockImplementation((shared: any, prefix?: string) => ({ __scoped: true, shared, prefix })),
}));

import { KubeMQModule } from '../../../src/module/kubemq.module.js';
import { KUBEMQ_SDK_CLIENT } from '../../../src/constants.js';

describe('KubeMQModule', () => {
  describe('forFeature', () => {
    it('creates ScopedKubeMQClientProxy with channelPrefix', () => {
      const result = KubeMQModule.forFeature({ name: 'SVC', channelPrefix: 'orders.' });

      expect(result.module).toBe(KubeMQModule);
      expect(result.exports).toContain('SVC');

      const provider = result.providers![0] as any;
      expect(provider.provide).toBe('SVC');
      expect(provider.inject).toContain(KUBEMQ_SDK_CLIENT);

      const mockSharedClient = { __proxy: true };
      const scoped = provider.useFactory(mockSharedClient);
      expect(scoped.__scoped).toBe(true);
      expect(scoped.prefix).toBe('orders.');
    });

    it('creates ScopedKubeMQClientProxy without channelPrefix', () => {
      const result = KubeMQModule.forFeature({ name: 'FEATURE_X' });
      const provider = result.providers![0] as any;
      const scoped = provider.useFactory({ __proxy: true });
      expect(scoped.__scoped).toBe(true);
      expect(scoped.prefix).toBeUndefined();
    });
  });

  describe('forFeatureAsync', () => {
    it('with useFactory resolves feature options', async () => {
      const result = KubeMQModule.forFeatureAsync({
        name: 'ASYNC_SVC',
        useFactory: () => ({ name: 'ASYNC_SVC', channelPrefix: 'billing.' }),
      });

      expect(result.module).toBe(KubeMQModule);
      expect(result.exports).toContain('ASYNC_SVC');

      const provider = result.providers![0] as any;
      const scoped = await provider.useFactory({ __proxy: true });
      expect(scoped.__scoped).toBe(true);
      expect(scoped.prefix).toBe('billing.');
    });

    it('with useClass instantiates factory and resolves', async () => {
      class TestFactory {
        createKubeMQFeatureOptions() {
          return { name: 'CLASS_SVC', channelPrefix: 'test.' };
        }
      }

      const result = KubeMQModule.forFeatureAsync({
        name: 'CLASS_SVC',
        useClass: TestFactory,
      });

      const provider = result.providers![0] as any;
      const scoped = await provider.useFactory({ __proxy: true });
      expect(scoped.__scoped).toBe(true);
      expect(scoped.prefix).toBe('test.');
    });

    it('with useExisting uses injected factory', async () => {
      class ExistingFactory {
        createKubeMQFeatureOptions() {
          return { name: 'EXIST_SVC', channelPrefix: 'existing.' };
        }
      }

      const result = KubeMQModule.forFeatureAsync({
        name: 'EXIST_SVC',
        useExisting: ExistingFactory,
        inject: [ExistingFactory],
      });

      const provider = result.providers![0] as any;
      const scoped = await provider.useFactory({ __proxy: true }, new ExistingFactory());
      expect(scoped.__scoped).toBe(true);
      expect(scoped.prefix).toBe('existing.');
    });

    it('without useFactory/useClass/useExisting falls back to name-only', async () => {
      const result = KubeMQModule.forFeatureAsync({ name: 'FALLBACK_SVC' });

      const provider = result.providers![0] as any;
      const scoped = await provider.useFactory({ __proxy: true });
      expect(scoped.__scoped).toBe(true);
      expect(scoped.prefix).toBeUndefined();
    });

    it('passes imports through', () => {
      const fakeModule = { module: class {} } as any;
      const result = KubeMQModule.forFeatureAsync({
        name: 'IMP_SVC',
        imports: [fakeModule],
      });
      expect(result.imports).toContain(fakeModule);
    });

    it('passes inject tokens through', () => {
      const result = KubeMQModule.forFeatureAsync({
        name: 'INJ_SVC',
        inject: ['CONFIG_SERVICE'],
        useFactory: () => ({ name: 'INJ_SVC' }),
      });
      const provider = result.providers![0] as any;
      expect(provider.inject).toContain(KUBEMQ_SDK_CLIENT);
      expect(provider.inject).toContain('CONFIG_SERVICE');
    });
  });

  describe('registerAsync', () => {
    it('with useFactory creates KubeMQClientProxy', async () => {
      const result = KubeMQModule.registerAsync({
        name: 'ASYNC_CLIENT',
        useFactory: () => ({ address: 'localhost:50000' }),
      });

      expect(result.module).toBe(KubeMQModule);
      expect(result.exports).toContain('ASYNC_CLIENT');

      const provider = result.providers![0] as any;
      expect(provider.provide).toBe('ASYNC_CLIENT');
      const client = await provider.useFactory();
      expect(client.__proxy).toBe(true);
    });

    it('with useClass creates KubeMQClientProxy from factory', async () => {
      class ClientFactory {
        createKubeMQClientOptions() {
          return { address: 'localhost:50000' };
        }
      }

      const result = KubeMQModule.registerAsync({
        name: 'CLASS_CLIENT',
        useClass: ClientFactory,
      });

      expect(result.providers!.length).toBe(2);
      const factoryProvider = result.providers![1] as any;
      const client = await factoryProvider.useFactory(new ClientFactory());
      expect(client.__proxy).toBe(true);
    });

    it('with useExisting creates KubeMQClientProxy from injected factory', async () => {
      class ExistingClientFactory {
        createKubeMQClientOptions() {
          return { address: 'existing:50000' };
        }
      }

      const result = KubeMQModule.registerAsync({
        name: 'EXIST_CLIENT',
        useExisting: ExistingClientFactory,
      });

      const provider = result.providers![0] as any;
      const client = await provider.useFactory(new ExistingClientFactory());
      expect(client.__proxy).toBe(true);
    });

    it('throws when no async option provided', () => {
      expect(() => KubeMQModule.registerAsync({ name: 'BAD' } as any)).toThrow(
        'requires one of',
      );
    });
  });
});
