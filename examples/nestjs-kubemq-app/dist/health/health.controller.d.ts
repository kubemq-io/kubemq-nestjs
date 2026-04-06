import { HealthCheckService } from '@nestjs/terminus';
import { KubeMQHealthIndicator } from '@kubemq/nestjs-transport';
export declare class HealthController {
    private readonly health;
    private readonly kubemq;
    constructor(health: HealthCheckService, kubemq: KubeMQHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult<any, any, any>>;
}
