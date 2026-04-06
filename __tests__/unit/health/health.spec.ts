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
});
