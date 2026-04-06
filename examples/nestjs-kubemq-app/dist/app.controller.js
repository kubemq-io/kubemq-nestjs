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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const order_service_1 = require("./order/order.service");
let AppController = class AppController {
    orderService;
    constructor(orderService) {
        this.orderService = orderService;
    }
    info() {
        return {
            name: 'nestjs-kubemq-example',
            description: 'Example NestJS app using @kubemq/nestjs-transport',
            endpoints: {
                'POST /orders': 'Create order (Command)',
                'GET /orders/:id': 'Get order (Query)',
                'POST /orders/:id/update': 'Update order (Event)',
                'POST /orders/:id/history': 'Record order event (EventStore)',
                'POST /orders/:id/process': 'Process order (Queue)',
            },
        };
    }
    async createOrder(body) {
        return this.orderService.createOrder(body);
    }
    async getOrder(id) {
        return this.orderService.getOrder(id);
    }
    async updateOrder(id, body) {
        return this.orderService.updateOrder(id, body.status);
    }
    async recordHistory(id, body) {
        return this.orderService.recordHistory(id, body.action);
    }
    async processOrder(id) {
        return this.orderService.enqueueOrder(id);
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "info", null);
__decorate([
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/history'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "recordHistory", null);
__decorate([
    (0, common_1.Post)('orders/:id/process'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "processOrder", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [order_service_1.OrderService])
], AppController);
