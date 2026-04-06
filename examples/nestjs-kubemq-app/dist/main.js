"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const nestjs_transport_1 = require("@kubemq/nestjs-transport");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const kubemqServer = new nestjs_transport_1.KubeMQServer({
        address: process.env.KUBEMQ_ADDRESS ?? 'localhost:50000',
        clientId: 'nestjs-example-server',
        group: 'example-group',
        defaultCommandTimeout: 10,
        defaultQueryTimeout: 10,
        eventsStore: {
            startFrom: 'new',
        },
        queue: {
            maxMessages: 1,
            waitTimeoutSeconds: 30,
        },
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule.forRoot(kubemqServer));
    app.connectMicroservice({ strategy: kubemqServer });
    await app.startAllMicroservices();
    await app.listen(3000);
    console.log('HTTP server running on http://localhost:3000');
    console.log('KubeMQ microservice connected');
    console.log('Health check available at http://localhost:3000/health');
}
bootstrap().catch((err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
});
