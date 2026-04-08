import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, KubeMQCommandContext } from '@kubemq/nestjs-transport';

// In production, consider using class-validator or Zod for runtime payload validation
interface CommandPayload {
  orderId?: string;
  status?: string;
}

@Injectable()
export class CommandHandlerService {
  private readonly logger = new Logger('CommandHandler');

  @CommandHandler('nestjs-rpc.handle-command')
  async handle(data: Record<string, unknown>, ctx: KubeMQCommandContext) {
    this.logger.log(`Processing command on ${ctx.channel}: ${JSON.stringify(data)}`);
    const payload = data as CommandPayload;
    const orderId = payload.orderId ?? 'unknown';
    const status = payload.status ?? 'unknown';
    this.logger.log(`Command processed — order ${orderId} ${status}`);
    return { processed: true, orderId, result: `order-${status}` };
  }
}
