// src/errors/serialization.error.ts
export class SerializationError extends Error {
  readonly channel?: string;
  readonly operation: string;

  constructor(message: string, options: { channel?: string; operation: string; cause?: Error }) {
    super(message, { cause: options.cause });
    this.name = 'SerializationError';
    this.channel = options.channel;
    this.operation = options.operation;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
