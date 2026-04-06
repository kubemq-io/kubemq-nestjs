import { DynamicModule } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
export declare class HealthModule {
    static register(kubemqServer: KubeMQServer): DynamicModule;
}
