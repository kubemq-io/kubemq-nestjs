"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_transport_1 = require("@kubemq/nestjs-transport");
const order_service_1 = require("./order.service");
const order_handlers_1 = require("./order.handlers");
let OrderModule = class OrderModule {
};
exports.OrderModule = OrderModule;
exports.OrderModule = OrderModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_transport_1.KubeMQModule.register({
                name: 'ORDER_KUBEMQ',
                address: process.env.KUBEMQ_ADDRESS ?? 'localhost:50000',
                clientId: 'nestjs-example-order-client',
                defaultCommandTimeout: 10,
                defaultQueryTimeout: 10,
            }),
        ],
        providers: [order_service_1.OrderService, order_handlers_1.OrderHandlers],
        exports: [order_service_1.OrderService],
    })
], OrderModule);
