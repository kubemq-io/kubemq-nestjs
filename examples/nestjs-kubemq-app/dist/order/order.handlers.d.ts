import { KubeMQCommandContext, KubeMQQueryContext, KubeMQContext, KubeMQEventStoreContext, KubeMQQueueContext } from '@kubemq/nestjs-transport';
export declare class OrderHandlers {
    private readonly logger;
    handleCreateOrder(data: {
        name: string;
        total: number;
    }, ctx: KubeMQCommandContext): {
        orderId: string;
        name: string;
        total: number;
        status: string;
    };
    handleGetOrder(data: {
        id: string;
    }, ctx: KubeMQQueryContext): {
        orderId: string;
        name: string;
        total: number;
        status: string;
        queriedAt: string;
    };
    handleOrderUpdated(data: {
        id: string;
        status: string;
    }, ctx: KubeMQContext): void;
    handleOrderHistory(data: {
        orderId: string;
        action: string;
        timestamp: string;
    }, ctx: KubeMQEventStoreContext): void;
    handleProcessOrder(data: {
        orderId: string;
        enqueuedAt: string;
    }, ctx: KubeMQQueueContext): void;
}
