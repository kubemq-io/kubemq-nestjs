import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KubeMQHealthIndicator } from '../../../src/health/kubemq.health-indicator.js';

describe('KubeMQHealthIndicator', () => {
  let indicator: KubeMQHealthIndicator;
  let mockClient: { ping: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockClient = {
      ping: vi.fn().mockResolvedValue({
        host: 'localhost:50000',
        version: '3.0.0',
        serverStartTime: 1700000000,
        serverUpTime: 86400,
      }),
    };
    indicator = new KubeMQHealthIndicator(mockClient as any, new Map(), false);
  });

  // Group 6, T2: health check default returns only status and latency
  it('default response returns only status and latencyMs (no broker details)', async () => {
    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq).toHaveProperty('latencyMs');
    expect(typeof result.kubemq.latencyMs).toBe('number');
    expect(result.kubemq).not.toHaveProperty('host');
    expect(result.kubemq).not.toHaveProperty('version');
    expect(result.kubemq).not.toHaveProperty('serverStartTime');
    expect(result.kubemq).not.toHaveProperty('serverUpTime');
    expect(mockClient.ping).toHaveBeenCalledOnce();
  });

  // Group 6, T3: health check verbose returns full details
  it('verbose mode returns broker details', async () => {
    indicator.setVerbose(true);
    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq).toHaveProperty('latencyMs');
    expect(result.kubemq.host).toBe('localhost:50000');
    expect(result.kubemq.version).toBe('3.0.0');
    expect(result.kubemq.serverStartTime).toBe(1700000000);
    expect(result.kubemq.serverUpTime).toBe(86400);
  });

  // Group 6, T4: health check error returns only status down (no error message)
  it('error returns only status down without error message', async () => {
    mockClient.ping.mockRejectedValueOnce(new Error('connection refused'));
    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('down');
    expect(result.kubemq).not.toHaveProperty('error');
  });

  // M-10: subscription errors report degraded status
  it('reports degraded status when subscription errors exist', async () => {
    const subErrors = new Map<string, string>();
    subErrors.set('orders-queue', 'stream broken: connection lost');
    indicator.setSubscriptionErrors(subErrors);

    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('degraded');
    expect(result.kubemq).toHaveProperty('latencyMs');
    expect(result.kubemq).not.toHaveProperty('streamErrors');
  });

  // M-10: verbose degraded status includes stream error details
  it('verbose degraded status includes stream error details', async () => {
    const subErrors = new Map<string, string>();
    subErrors.set('orders-queue', 'stream broken: connection lost');
    indicator.setSubscriptionErrors(subErrors);
    indicator.setVerbose(true);

    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('degraded');
    expect(result.kubemq.streamErrors).toEqual({
      'orders-queue': 'stream broken: connection lost',
    });
  });

  it('fromServer() creates indicator from server.unwrap() and getSubscriptionErrors()', () => {
    const subErrors = new Map<string, string>();
    const mockServer = {
      unwrap: vi.fn().mockReturnValue(mockClient),
      getSubscriptionErrors: vi.fn().mockReturnValue(subErrors),
    };

    const ind = KubeMQHealthIndicator.fromServer(mockServer as any);

    expect(mockServer.unwrap).toHaveBeenCalledOnce();
    expect(mockServer.getSubscriptionErrors).toHaveBeenCalledOnce();
    expect(ind).toBeInstanceOf(KubeMQHealthIndicator);
  });

  it('fromServer(server, verbose=true) creates a verbose indicator', async () => {
    const mockServer = {
      unwrap: vi.fn().mockReturnValue(mockClient),
      getSubscriptionErrors: vi.fn().mockReturnValue(new Map()),
    };

    const ind = KubeMQHealthIndicator.fromServer(mockServer as any, true);
    const result = await ind.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq.host).toBe('localhost:50000');
    expect(result.kubemq.version).toBe('3.0.0');
  });

  it('verbose=true includes host, version, serverStartTime, serverUpTime', async () => {
    const ind = new KubeMQHealthIndicator(mockClient as any, new Map(), true);
    const result = await ind.isHealthy('svc');

    expect(result.svc.status).toBe('up');
    expect(result.svc.host).toBe('localhost:50000');
    expect(result.svc.version).toBe('3.0.0');
    expect(result.svc.serverStartTime).toBe(1700000000);
    expect(result.svc.serverUpTime).toBe(86400);
  });

  it('ping failure returns status down', async () => {
    mockClient.ping.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq).toEqual({ status: 'down' });
  });

  it('setCircuitBreakerStateGetter includes circuitBreakerState in healthy result', async () => {
    indicator.setVerbose(true);
    indicator.setCircuitBreakerStateGetter(() => 'closed');

    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq.circuitBreakerState).toBe('closed');
  });

  it('setDlqRoutedCountGetter includes dlqRoutedCount in healthy result', async () => {
    indicator.setVerbose(true);
    indicator.setDlqRoutedCountGetter(() => 42);

    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq.dlqRoutedCount).toBe(42);
  });

  it('degraded + circuitBreakerState + dlqRoutedCount', async () => {
    const subErrors = new Map([['q1', 'broken']]);
    indicator.setSubscriptionErrors(subErrors);
    indicator.setCircuitBreakerStateGetter(() => 'open');
    indicator.setDlqRoutedCountGetter(() => 5);

    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('degraded');
    expect(result.kubemq.circuitBreakerState).toBe('open');
    expect(result.kubemq.dlqRoutedCount).toBe(5);
    expect(result.kubemq).not.toHaveProperty('streamErrors');
  });

  it('degraded + verbose includes streamErrors, circuitBreakerState, dlqRoutedCount', async () => {
    const subErrors = new Map([['q1', 'broken']]);
    indicator.setSubscriptionErrors(subErrors);
    indicator.setVerbose(true);
    indicator.setCircuitBreakerStateGetter(() => 'half-open');
    indicator.setDlqRoutedCountGetter(() => 10);

    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.status).toBe('degraded');
    expect(result.kubemq.streamErrors).toEqual({ q1: 'broken' });
    expect(result.kubemq.circuitBreakerState).toBe('half-open');
    expect(result.kubemq.dlqRoutedCount).toBe(10);
  });

  it('circuitBreakerState getter returning undefined is still included', async () => {
    indicator.setVerbose(true);
    indicator.setCircuitBreakerStateGetter(() => undefined);

    const result = await indicator.isHealthy('kubemq');

    expect(result.kubemq.circuitBreakerState).toBeUndefined();
    expect(result.kubemq).toHaveProperty('circuitBreakerState');
  });
});
