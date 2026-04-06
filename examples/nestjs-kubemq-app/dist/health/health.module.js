"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HealthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthModule = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const nestjs_transport_1 = require("@kubemq/nestjs-transport");
const health_controller_1 = require("./health.controller");
let HealthModule = HealthModule_1 = class HealthModule {
    static register(kubemqServer) {
        return {
            module: HealthModule_1,
            imports: [terminus_1.TerminusModule],
            controllers: [health_controller_1.HealthController],
            providers: [
                {
                    provide: nestjs_transport_1.KubeMQHealthIndicator,
                    useFactory: () => nestjs_transport_1.KubeMQHealthIndicator.fromServer(kubemqServer),
                },
            ],
        };
    }
};
exports.HealthModule = HealthModule;
exports.HealthModule = HealthModule = HealthModule_1 = __decorate([
    (0, common_1.Module)({})
], HealthModule);
