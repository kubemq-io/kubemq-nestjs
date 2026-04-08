import { Catch, ExceptionFilter, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { KubeMQRpcException } from '@kubemq/nestjs-transport';
import type { KubeMQRpcError } from '@kubemq/nestjs-transport';

function isKubeMQRpcError(val: unknown): val is KubeMQRpcError {
  return typeof val === 'object' && val !== null && 'statusCode' in val;
}

@Catch(KubeMQRpcException)
export class KubeMQExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(KubeMQExceptionFilter.name);

  catch(exception: KubeMQRpcException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const raw = exception.getError();
    const brokerError = isKubeMQRpcError(raw) ? raw : null;
    const statusCode =
      brokerError !== null &&
      typeof brokerError.statusCode === 'number' &&
      Number.isFinite(brokerError.statusCode)
        ? brokerError.statusCode
        : 500;

    if (brokerError !== null) {
      this.logger.warn(
        `KubeMQ error: ${brokerError.message} (code: ${brokerError.kubemqCode}, category: ${brokerError.kubemqCategory}, channel: ${brokerError.channel})`,
      );
    } else {
      this.logger.warn(`KubeMQ error: non-standard payload: ${String(raw)}`);
    }

    const timestamp = new Date().toISOString();
    response.status(statusCode).json({
      statusCode,
      error: 'KubeMQ Error',
      timestamp,
    });
  }
}
