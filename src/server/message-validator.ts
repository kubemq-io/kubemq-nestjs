import { Logger } from '@nestjs/common';
import { ConfigurationError } from '../errors/configuration.error.js';
import { MessageValidationError } from '../errors/validation.error.js';

let classValidator: typeof import('class-validator') | null = null;
let classTransformer: typeof import('class-transformer') | null = null;

async function loadValidationDeps(): Promise<boolean> {
  if (classValidator && classTransformer) return true;
  try {
    [classValidator, classTransformer] = await Promise.all([
      import('class-validator'),
      import('class-transformer'),
    ]);
    return true;
  } catch {
    return false;
  }
}

export class MessageValidator {
  private readonly logger = new Logger('MessageValidator');

  async validate(
    data: unknown,
    dtoClass: new (...args: any[]) => any,
    channel: string,
  ): Promise<{ valid: boolean; error?: MessageValidationError }> {
    if (!(await loadValidationDeps())) {
      const msg =
        'class-validator and class-transformer are required when a handler sets `validate`. ' +
        'Install them: npm install class-validator class-transformer';
      this.logger.error(msg);
      throw new ConfigurationError(msg);
    }

    const plain = data != null && typeof (data as any).toJSON === 'function'
      ? (data as any).toJSON()
      : data;

    const instance = classTransformer!.plainToInstance(dtoClass, plain);
    const errors = await classValidator!.validate(instance);

    if (errors.length === 0) {
      return { valid: true };
    }

    const violations = errors.map((e) => ({
      property: e.property,
      constraints: e.constraints ?? {},
    }));

    return {
      valid: false,
      error: new MessageValidationError(channel, violations),
    };
  }
}
