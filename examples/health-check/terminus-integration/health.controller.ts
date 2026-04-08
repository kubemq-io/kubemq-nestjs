import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  type HealthCheckResult,
  type HealthIndicatorResult,
} from '@nestjs/terminus';
import { KubeMQHealthIndicator } from '@kubemq/nestjs-transport';

@Controller('health')
export class HealthController {
  private indicator: KubeMQHealthIndicator | null = null;

  constructor(private readonly health: HealthCheckService) {}

  setIndicator(indicator: KubeMQHealthIndicator): void {
    this.indicator = indicator;
  }

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        if (!this.indicator) {
          return { kubemq: { status: 'up' } };
        }
        const result = await this.indicator.isHealthy('kubemq');
        return result as HealthIndicatorResult;
      },
    ]);
  }
}
