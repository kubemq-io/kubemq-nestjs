"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const nestjs_transport_1 = require("@kubemq/nestjs-transport");
const rxjs_1 = require("rxjs");
let OrderService = class OrderService {
    client;
    constructor(client) {
        this.client = client;
    }
    async createOrder(data) {
        const result = await (0, rxjs_1.firstValueFrom)(this.client.send('orders.create', data));
        return result;
    }
    async getOrder(id) {
        const record = new nestjs_transport_1.KubeMQRecord({ id }).asQuery();
        const result = await (0, rxjs_1.firstValueFrom)(this.client.send('orders.get', record));
        return result;
    }
    async updateOrder(id, status) {
        await (0, rxjs_1.firstValueFrom)(this.client.emit('orders.updated', { id, status }));
        return { success: true, message: 'Update event emitted' };
    }
    async recordHistory(id, action) {
        const record = new nestjs_transport_1.KubeMQRecord({
            orderId: id,
            action,
            timestamp: new Date().toISOString(),
        }).asEventStore();
        await (0, rxjs_1.firstValueFrom)(this.client.emit('orders.history', record));
        return { success: true, message: 'History event stored' };
    }
    async enqueueOrder(id) {
        const record = new nestjs_transport_1.KubeMQRecord({
            orderId: id,
            enqueuedAt: new Date().toISOString(),
        }).asQueue();
        await (0, rxjs_1.firstValueFrom)(this.client.emit('orders.process', record));
        return { success: true, message: 'Order enqueued for processing' };
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ORDER_KUBEMQ')),
    __metadata("design:paramtypes", [microservices_1.ClientProxy])
], OrderService);
