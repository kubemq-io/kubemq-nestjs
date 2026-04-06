import { ClientProxy } from '@nestjs/microservices';
export declare class OrderService {
    private readonly client;
    constructor(client: ClientProxy);
    createOrder(data: {
        name: string;
        total: number;
    }): Promise<any>;
    getOrder(id: string): Promise<any>;
    updateOrder(id: string, status: string): Promise<{
        success: boolean;
        message: string;
    }>;
    recordHistory(id: string, action: string): Promise<{
        success: boolean;
        message: string;
    }>;
    enqueueOrder(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
