"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AppModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_transport_1 = require("@kubemq/nestjs-transport");
const app_controller_1 = require("./app.controller");
const order_module_1 = require("./order/order.module");
const health_module_1 = require("./health/health.module");
let AppModule = AppModule_1 = class AppModule {
    static forRoot(kubemqServer) {
        return {
            module: AppModule_1,
            imports: [
                nestjs_transport_1.KubeMQModule.forRoot({
                    address: process.env.KUBEMQ_ADDRESS ?? 'localhost:50000',
                    clientId: 'nestjs-example-global',
                    isGlobal: true,
                }),
                order_module_1.OrderModule,
                health_module_1.HealthModule.register(kubemqServer),
            ],
            controllers: [app_controller_1.AppController],
        };
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = AppModule_1 = __decorate([
    (0, common_1.Module)({})
], AppModule);
