import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { KubeMQHealthIndicator } from '@kubemq/nestjs-transport';

/**
 * Health check controller using @nestjs/terminus.
 * Exposes GET /health that verifies KubeMQ broker connectivity via ping().
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly kubemq: KubeMQHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.kubemq.isHealthy('kubemq'),
    ]);
  }
}
