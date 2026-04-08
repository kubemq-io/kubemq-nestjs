import { Logger } from '@nestjs/common';

const logger = new Logger('OrderHandler');

export function handleCreateOrder(data: { product: string; quantity: number }): {
  orderId: string;
  product: string;
  status: string;
} {
  logger.log(`Processing order: product=${data.product}, qty=${data.quantity}`);
  return {
    orderId: `ORD-${Date.now()}`,
    product: data.product,
    status: 'created',
  };
}

export function handleOrderNotification(data: { orderId: string; message: string }): void {
  logger.log(`Notification for ${data.orderId}: ${data.message}`);
}
