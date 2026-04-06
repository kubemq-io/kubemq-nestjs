import { Logger as NestLogger } from '@nestjs/common';
import type { Logger as KubeMQLogger } from 'kubemq-js';
import { safeStringify } from '../utils/safe-stringify.js';

export function createNestKubeMQLogger(context: string): KubeMQLogger {
  const nestLogger = new NestLogger(context);

  return {
    debug(msg: string, fields?: Record<string, unknown>): void {
      nestLogger.debug(fields ? `${msg} ${safeStringify(fields)}` : msg);
    },
    info(msg: string, fields?: Record<string, unknown>): void {
      nestLogger.log(fields ? `${msg} ${safeStringify(fields)}` : msg);
    },
    warn(msg: string, fields?: Record<string, unknown>): void {
      nestLogger.warn(fields ? `${msg} ${safeStringify(fields)}` : msg);
    },
    error(msg: string, fields?: Record<string, unknown>): void {
      nestLogger.error(fields ? `${msg} ${safeStringify(fields)}` : msg);
    },
  };
}
