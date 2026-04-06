import type { Type, DynamicModule, ForwardReference, InjectionToken } from '@nestjs/common';
import type { KubeMQServerOptions } from './kubemq-server-options.interface.js';
import type { KubeMQClientOptions } from './kubemq-client-options.interface.js';

export interface KubeMQModuleOptions extends KubeMQServerOptions {
  isGlobal?: boolean;
}

export interface KubeMQOptionsFactory {
  createKubeMQOptions(): KubeMQModuleOptions | Promise<KubeMQModuleOptions>;
}

export interface KubeMQModuleAsyncOptions {
  isGlobal?: boolean;
  imports?: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  useFactory?: (...args: unknown[]) => KubeMQModuleOptions | Promise<KubeMQModuleOptions>;
  useClass?: Type<KubeMQOptionsFactory>;
  useExisting?: Type<KubeMQOptionsFactory>;
  inject?: InjectionToken[];
}

export interface KubeMQRegisterOptions extends KubeMQClientOptions {
  name: string | symbol;
}

export interface KubeMQClientOptionsFactory {
  createKubeMQClientOptions(): KubeMQClientOptions | Promise<KubeMQClientOptions>;
}

export interface KubeMQRegisterAsyncOptions {
  name: string | symbol;
  imports?: Array<Type<unknown> | DynamicModule | Promise<DynamicModule> | ForwardReference>;
  useFactory?: (...args: unknown[]) => KubeMQClientOptions | Promise<KubeMQClientOptions>;
  useClass?: Type<KubeMQClientOptionsFactory>;
  useExisting?: Type<KubeMQClientOptionsFactory>;
  inject?: InjectionToken[];
}

export interface KubeMQTestOptions {
  name?: string | symbol;
  isGlobal?: boolean;
}
