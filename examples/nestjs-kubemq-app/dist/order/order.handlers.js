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
var OrderHandlers_1;
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderHandlers = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const nestjs_transport_1 = require("@kubemq/nestjs-transport");
let OrderHandlers = OrderHandlers_1 = class OrderHandlers {
    logger = new common_1.Logger(OrderHandlers_1.name);
    handleCreateOrder(data, ctx) {
        this.logger.log(`Command received on ${ctx.channel} from ${ctx.fromClientId}`);
        const orderId = `order-${Date.now()}`;
        this.logger.log(`Order created: ${orderId} - ${data.name} ($${data.total})`);
        return {
            orderId,
            name: data.name,
            total: data.total,
            status: 'created',
        };
    }
    handleGetOrder(data, ctx) {
        this.logger.log(`Query received on ${ctx.channel} from ${ctx.fromClientId}`);
        return {
            orderId: data.id,
            name: 'Sample Order',
            total: 99.99,
            status: 'completed',
            queriedAt: new Date().toISOString(),
        };
    }
    handleOrderUpdated(data, ctx) {
        this.logger.log(`Event received on ${ctx.channel}: Order ${data.id} -> ${data.status}`);
    }
    handleOrderHistory(data, ctx) {
        this.logger.log(`EventStore received on ${ctx.channel} (seq: ${ctx.sequence}): ` +
            `Order ${data.orderId} - ${data.action} at ${data.timestamp}`);
    }
    handleProcessOrder(data, ctx) {
        this.logger.log(`Queue message received on ${ctx.channel} (seq: ${ctx.sequence}, ` +
            `deliveries: ${ctx.receiveCount}): Order ${data.orderId}`);
        this.logger.log(`Processing order ${data.orderId} (enqueued at ${data.enqueuedAt})`);
    }
};
exports.OrderHandlers = OrderHandlers;
__decorate([
    (0, nestjs_transport_1.CommandHandler)('orders.create', { timeout: 10, group: 'order-writers' }),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_a = typeof nestjs_transport_1.KubeMQCommandContext !== "undefined" && nestjs_transport_1.KubeMQCommandContext) === "function" ? _a : Object]),
    __metadata("design:returntype", void 0)
], OrderHandlers.prototype, "handleCreateOrder", null);
__decorate([
    (0, nestjs_transport_1.QueryHandler)('orders.get', {
        timeout: 10,
        cacheKey: 'order:{id}',
        cacheTtl: 60,
    }),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof nestjs_transport_1.KubeMQQueryContext !== "undefined" && nestjs_transport_1.KubeMQQueryContext) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], OrderHandlers.prototype, "handleGetOrder", null);
__decorate([
    (0, nestjs_transport_1.EventHandler)('orders.updated'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof nestjs_transport_1.KubeMQContext !== "undefined" && nestjs_transport_1.KubeMQContext) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], OrderHandlers.prototype, "handleOrderUpdated", null);
__decorate([
    (0, nestjs_transport_1.EventStoreHandler)('orders.history', { startFrom: 'first' }),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_d = typeof nestjs_transport_1.KubeMQEventStoreContext !== "undefined" && nestjs_transport_1.KubeMQEventStoreContext) === "function" ? _d : Object]),
    __metadata("design:returntype", void 0)
], OrderHandlers.prototype, "handleOrderHistory", null);
__decorate([
    (0, nestjs_transport_1.QueueHandler)('orders.process', {
        maxMessages: 1,
        waitTimeoutSeconds: 30,
    }),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_e = typeof nestjs_transport_1.KubeMQQueueContext !== "undefined" && nestjs_transport_1.KubeMQQueueContext) === "function" ? _e : Object]),
    __metadata("design:returntype", void 0)
], OrderHandlers.prototype, "handleProcessOrder", null);
exports.OrderHandlers = OrderHandlers = OrderHandlers_1 = __decorate([
    (0, common_1.Injectable)()
], OrderHandlers);
