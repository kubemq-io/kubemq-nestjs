import { Injectable } from '@nestjs/common';
import { KubeMQHealthIndicator } from '@kubemq/nestjs-transport';
import type { HealthIndicatorResult } from '@kubemq/nestjs-transport';

@Injectable()
export class HealthService {
  private indicator: KubeMQHealthIndicator | null = null;

  setIndicator(indicator: KubeMQHealthIndicator): void {
    this.indicator = indicator;
  }

  async check(): Promise<HealthIndicatorResult> {
    if (!this.indicator) {
      return { kubemq: { status: 'not_initialized' } };
    }
    return this.indicator.isHealthy('kubemq');
  }
}
