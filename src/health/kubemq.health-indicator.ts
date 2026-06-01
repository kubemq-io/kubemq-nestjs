import type { KubeMQClient } from 'kubemq-js';
import type { KubeMQServer } from '../server/kubemq.server.js';

export interface HealthIndicatorResult {
  [key: string]: { status: string; [key: string]: unknown };
}

/**
 * Terminus-compatible health indicator. Construct with a connected {@link KubeMQClient}
 * (e.g. from {@link KubeMQServer.unwrap}) and optional subscription error map from
 * {@link KubeMQServer.getSubscriptionErrors}.
 */
export class KubeMQHealthIndicator {
  private subscriptionErrors: ReadonlyMap<string, string>;
  private verbose: boolean;
  private getCircuitBreakerState?: () => string | undefined;
  private getDlqRoutedCount?: () => number;

  constructor(
    private readonly client: KubeMQClient,
    subscriptionErrors: ReadonlyMap<string, string>,
    verbose = false,
  ) {
    this.subscriptionErrors = subscriptionErrors;
    this.verbose = verbose;
  }

  /**
   * Build an indicator after the microservice transport has started and bound handlers.
   */
  static fromServer(server: KubeMQServer, verbose = false): KubeMQHealthIndicator {
    return new KubeMQHealthIndicator(server.unwrap(), server.getSubscriptionErrors(), verbose);
  }

  setSubscriptionErrors(errors: ReadonlyMap<string, string>): void {
    this.subscriptionErrors = errors;
  }

  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  setCircuitBreakerStateGetter(fn: () => string | undefined): void {
    this.getCircuitBreakerState = fn;
  }

  setDlqRoutedCountGetter(fn: () => number): void {
    this.getDlqRoutedCount = fn;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const start = Date.now();
      const info = await this.client.ping();
      const latencyMs = Date.now() - start;

      if (this.subscriptionErrors.size > 0) {
        return {
          [key]: {
            status: 'degraded',
            latencyMs,
            ...(this.verbose ? { streamErrors: Object.fromEntries(this.subscriptionErrors) } : {}),
            ...(this.getCircuitBreakerState
              ? { circuitBreakerState: this.getCircuitBreakerState() }
              : {}),
            ...(this.getDlqRoutedCount
              ? { dlqRoutedCount: this.getDlqRoutedCount() }
              : {}),
          },
        };
      }

      if (this.verbose) {
        return {
          [key]: {
            status: 'up',
            latencyMs,
            host: info.host,
            version: info.version,
            serverStartTime: info.serverStartTime,
            serverUpTime: info.serverUpTime,
            ...(this.getCircuitBreakerState
              ? { circuitBreakerState: this.getCircuitBreakerState() }
              : {}),
            ...(this.getDlqRoutedCount
              ? { dlqRoutedCount: this.getDlqRoutedCount() }
              : {}),
          },
        };
      }
      return { [key]: { status: 'up', latencyMs } };
    } catch {
      return { [key]: { status: 'down' } };
    }
  }
}
