import { DynamicModule } from '@nestjs/common';
import { KubeMQServer } from '@kubemq/nestjs-transport';
export declare class AppModule {
    static forRoot(kubemqServer: KubeMQServer): DynamicModule;
}
