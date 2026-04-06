import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { KubeMQModule } from '../../../src/module/kubemq.module.js';
import { KUBEMQ_MODULE_OPTIONS } from '../../../src/constants.js';

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
});
