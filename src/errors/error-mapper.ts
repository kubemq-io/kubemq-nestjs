import {
  KubeMQError,
  ConnectionError,
  AuthenticationError,
  AuthorizationError,
  KubeMQTimeoutError,
  ValidationError,
  TransientError,
  ThrottlingError,
  NotFoundError,
  FatalError,
  CancellationError,
  BufferFullError,
  StreamBrokenError,
  ClientClosedError,
  ConnectionNotReadyError,
  ConfigurationError,
  RetryExhaustedError,
  NotImplementedError,
  PartialFailureError,
} from 'kubemq-js';
import { KubeMQRpcException } from './kubemq-rpc.exception.js';

const SANITIZED_CLIENT_MESSAGE = 'Transport operation failed';

export function mapErrorToRpcException(
  err: Error,
  channel?: string,
  verbose = false,
): KubeMQRpcException {
  if (!(err instanceof KubeMQError)) {
    return new KubeMQRpcException({
      statusCode: 500,
      message: verbose ? err.message : SANITIZED_CLIENT_MESSAGE,
      kubemqCode: 'UNKNOWN',
      kubemqCategory: 'Fatal',
      channel,
    });
  }

  let statusCode: number;

  if (err instanceof AuthenticationError) {
    statusCode = 401;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
  } else if (err instanceof KubeMQTimeoutError) {
    statusCode = 408;
  } else if (err instanceof ValidationError || err instanceof ConfigurationError) {
    statusCode = 400;
  } else if (err instanceof ThrottlingError) {
    statusCode = 429;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
  } else if (err instanceof CancellationError) {
    statusCode = 499;
  } else if (err instanceof NotImplementedError) {
    statusCode = 501;
  } else if (err instanceof PartialFailureError) {
    statusCode = 207;
  } else if (
    err instanceof ConnectionError ||
    err instanceof TransientError ||
    err instanceof BufferFullError ||
    err instanceof StreamBrokenError ||
    err instanceof ConnectionNotReadyError ||
    err instanceof RetryExhaustedError
  ) {
    statusCode = 503;
  } else if (err instanceof ClientClosedError || err instanceof FatalError) {
    statusCode = 500;
  } else {
    statusCode = 500;
  }

  return new KubeMQRpcException({
    statusCode,
    message: verbose ? err.message : SANITIZED_CLIENT_MESSAGE,
    kubemqCode: err.code,
    kubemqCategory: err.category,
    channel: err.channel ?? channel,
  });
}

export function mapToRpcException(
  type: 'command' | 'query',
  channel: string,
  errorMessage?: string,
  verbose = false,
): KubeMQRpcException {
  const detail = errorMessage ?? `${type} execution failed on channel ${channel}`;
  return new KubeMQRpcException({
    statusCode: 500,
    message: verbose ? detail : SANITIZED_CLIENT_MESSAGE,
    kubemqCode: 'HANDLER_ERROR',
    kubemqCategory: 'Fatal',
    channel,
  });
}
