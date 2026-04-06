import { OrderService } from './order/order.service';
export declare class AppController {
    private readonly orderService;
    constructor(orderService: OrderService);
    info(): {
        name: string;
        description: string;
        endpoints: {
            'POST /orders': string;
            'GET /orders/:id': string;
            'POST /orders/:id/update': string;
            'POST /orders/:id/history': string;
            'POST /orders/:id/process': string;
        };
    };
    createOrder(body: {
        name: string;
        total: number;
    }): Promise<any>;
    getOrder(id: string): Promise<any>;
    updateOrder(id: string, body: {
        status: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    recordHistory(id: string, body: {
        action: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    processOrder(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
