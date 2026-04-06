import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { KubeMQModule } from '../../../src/module/kubemq.module.js';
import { MockKubeMQClient } from '../../../src/testing/mock-kubemq-client.js';
import { MockKubeMQServer } from '../../../src/testing/mock-kubemq-server.js';
import { KUBEMQ_MODULE_OPTIONS } from '../../../src/constants.js';

describe('KubeMQModule.forTest()', () => {
  it('produces a global dynamic module with mock providers', () => {
    const result = KubeMQModule.forTest();

    expect(result.module).toBe(KubeMQModule);
    expect(result.global).toBe(true);
    expect(result.providers).toBeDefined();
    expect(result.exports).toBeDefined();
  });

  it('registers KUBEMQ_MODULE_OPTIONS with mock address', () => {
    const result = KubeMQModule.forTest();

    const optionsProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === KUBEMQ_MODULE_OPTIONS,
    );
    expect(optionsProvider).toBeDefined();
    expect(optionsProvider.useValue.address).toBe('mock://localhost:50000');
  });

  it('registers MockKubeMQClient as default KUBEMQ_SERVICE', () => {
    const result = KubeMQModule.forTest();

    const clientProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === 'KUBEMQ_SERVICE',
    );
    expect(clientProvider).toBeDefined();
    expect(clientProvider.useValue).toBeInstanceOf(MockKubeMQClient);
  });

  it('registers MockKubeMQServer as injectable', () => {
    const result = KubeMQModule.forTest();

    const serverProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === MockKubeMQServer,
    );
    expect(serverProvider).toBeDefined();
    expect(serverProvider.useValue).toBeInstanceOf(MockKubeMQServer);
  });

  it('uses custom name when provided', () => {
    const customName = 'MY_KUBEMQ';
    const result = KubeMQModule.forTest({ name: customName });

    const clientProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === customName,
    );
    expect(clientProvider).toBeDefined();
    expect(clientProvider.useValue).toBeInstanceOf(MockKubeMQClient);

    const defaultProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === 'KUBEMQ_SERVICE',
    );
    expect(defaultProvider).toBeUndefined();
  });

  it('respects isGlobal: false', () => {
    const result = KubeMQModule.forTest({ isGlobal: false });
    expect(result.global).toBe(false);
  });

  it('exports MockKubeMQClient and MockKubeMQServer', () => {
    const result = KubeMQModule.forTest();
    expect(result.exports).toContain(MockKubeMQClient);
    expect(result.exports).toContain(MockKubeMQServer);
    expect(result.exports).toContain(KUBEMQ_MODULE_OPTIONS);
    expect(result.exports).toContain('KUBEMQ_SERVICE');
  });

  it('shares same mock instance between name provider and class provider', () => {
    const result = KubeMQModule.forTest();

    const namedProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === 'KUBEMQ_SERVICE',
    );
    const classProvider = (result.providers as any[])?.find(
      (p: any) => p.provide === MockKubeMQClient,
    );

    expect(namedProvider.useValue).toBe(classProvider.useValue);
  });
});
