import { RpcException } from '@nestjs/microservices';

export interface KubeMQRpcError {
  statusCode: number;
  message: string;
  kubemqCode: string;
  kubemqCategory: string;
  channel?: string;
}

export class KubeMQRpcException extends RpcException {}
