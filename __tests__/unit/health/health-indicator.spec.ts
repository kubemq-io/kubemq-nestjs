import { describe, it, expect, vi } from 'vitest';
import { KubeMQHealthIndicator } from '../../../src/health/kubemq.health-indicator.js';

describe('KubeMQHealthIndicator', () => {
  function createMockClient(pingResult?: any, shouldReject = false) {
    return {
      ping: shouldReject
        ? vi.fn().mockRejectedValue(new Error('connection refused'))
        : vi.fn().mockResolvedValue(
            pingResult ?? {
              host: 'localhost:50000',
              version: '2.5.0',
              serverStartTime: 1700000000,
              serverUpTime: 3600,
            },
          ),
    };
  }

  function createMockServer(client: any, errors = new Map<string, string>()) {
    return {
      unwrap: () => client,
      getSubscriptionErrors: () => errors,
    };
  }

  it('fromServer creates indicator from server', () => {
    const client = createMockClient();
    const server = createMockServer(client);
    const indicator = KubeMQHealthIndicator.fromServer(server as any);
    expect(indicator).toBeInstanceOf(KubeMQHealthIndicator);
  });

  it('fromServer with verbose=true creates verbose indicator', async () => {
    const client = createMockClient();
    const server = createMockServer(client);
    const indicator = KubeMQHealthIndicator.fromServer(server as any, true);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq.host).toBe('localhost:50000');
    expect(result.kubemq.version).toBe('2.5.0');
  });

  it('isHealthy returns up with latencyMs when ping succeeds', async () => {
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, new Map(), false);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('up');
    expect(typeof result.kubemq.latencyMs).toBe('number');
  });

  it('isHealthy verbose=true shows host, version, uptime', async () => {
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, new Map(), true);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq.host).toBe('localhost:50000');
    expect(result.kubemq.version).toBe('2.5.0');
    expect(result.kubemq.serverUpTime).toBe(3600);
  });

  it('isHealthy returns degraded when subscription errors exist', async () => {
    const errors = new Map([['events-sub', 'stream reset']]);
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, errors, false);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('degraded');
    expect(typeof result.kubemq.latencyMs).toBe('number');
  });

  it('isHealthy degraded + verbose shows stream errors', async () => {
    const errors = new Map([
      ['cmd-sub', 'timeout'],
      ['event-sub', 'disconnect'],
    ]);
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, errors, true);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('degraded');
    expect(result.kubemq.streamErrors).toEqual({
      'cmd-sub': 'timeout',
      'event-sub': 'disconnect',
    });
  });

  it('setCircuitBreakerStateGetter affects degraded output', async () => {
    const errors = new Map([['sub-1', 'error']]);
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, errors, false);
    indicator.setCircuitBreakerStateGetter(() => 'open');
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.circuitBreakerState).toBe('open');
  });

  it('setCircuitBreakerStateGetter affects verbose up output', async () => {
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, new Map(), true);
    indicator.setCircuitBreakerStateGetter(() => 'closed');
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq.circuitBreakerState).toBe('closed');
  });

  it('setDlqRoutedCountGetter affects degraded output', async () => {
    const errors = new Map([['sub-1', 'error']]);
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, errors, false);
    indicator.setDlqRoutedCountGetter(() => 42);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.dlqRoutedCount).toBe(42);
  });

  it('setDlqRoutedCountGetter affects verbose up output', async () => {
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, new Map(), true);
    indicator.setDlqRoutedCountGetter(() => 7);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('up');
    expect(result.kubemq.dlqRoutedCount).toBe(7);
  });

  it('ping rejection returns down status', async () => {
    const client = createMockClient(undefined, true);
    const indicator = new KubeMQHealthIndicator(client as any, new Map(), false);
    const result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('down');
  });

  it('setSubscriptionErrors updates errors for subsequent checks', async () => {
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, new Map(), false);

    let result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('up');

    indicator.setSubscriptionErrors(new Map([['sub-x', 'broken']]));
    result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.status).toBe('degraded');
  });

  it('setVerbose toggles verbose mode', async () => {
    const client = createMockClient();
    const indicator = new KubeMQHealthIndicator(client as any, new Map(), false);

    let result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.host).toBeUndefined();

    indicator.setVerbose(true);
    result = await indicator.isHealthy('kubemq');
    expect(result.kubemq.host).toBe('localhost:50000');
  });
});
