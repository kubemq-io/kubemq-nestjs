import { describe, it, expect, vi } from 'vitest';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { MessageValidator } from '../../../src/server/message-validator.js';
import { MessageValidationError } from '../../../src/errors/validation.error.js';

class ValidDto {
  @IsString()
  name!: string;
}

describe('MessageValidator', () => {
  const validator = new MessageValidator();

  // SV-1: Valid payload passes validation
  it('returns valid for a valid payload', async () => {
    const result = await validator.validate({ name: 'test' }, ValidDto, 'orders');
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  // SV-2: Invalid payload returns error with violations
  it('validates using class-validator and returns violations', async () => {
    class StrictDto {
      @IsNotEmpty()
      name!: string;
    }

    const result = await validator.validate({}, StrictDto, 'orders');
    expect(result.valid).toBe(false);
    expect(result.error).toBeInstanceOf(MessageValidationError);
    expect(result.error!.violations.length).toBeGreaterThan(0);
    expect(result.error!.channel).toBe('orders');
  });

  // SV-3: Error message includes channel and violation count
  it('error message includes channel and violation count', async () => {
    class RequiredDto {
      @IsNotEmpty()
      field!: string;
    }

    const result = await validator.validate({}, RequiredDto, 'payments');
    expect(result.valid).toBe(false);
    expect(result.error!.message).toContain('payments');
    expect(result.error!.message).toMatch(/\d+ violation/);
  });

  // SV-4: Valid payload with optional field passes
  it('passes when all constraints are satisfied', async () => {
    class OptionalDto {
      @IsOptional()
      @IsString()
      value?: string;
    }

    const result = await validator.validate({ value: 'anything' }, OptionalDto, 'test');
    expect(result.valid).toBe(true);
  });

  // SV-5: toJSON() is called when present on data
  it('uses toJSON() result when data has toJSON method', async () => {
    const data = {
      toJSON() {
        return { name: 'from-toJSON' };
      },
    };
    const result = await validator.validate(data, ValidDto, 'test');
    expect(result.valid).toBe(true);
  });

  // SV-6: deps fail to load → throws ConfigurationError
  it('throws ConfigurationError when validation deps cannot be loaded', async () => {
    vi.resetModules();
    vi.doMock('class-validator', () => {
      throw new Error('MODULE_NOT_FOUND');
    });
    vi.doMock('class-transformer', () => {
      throw new Error('MODULE_NOT_FOUND');
    });
    const { MessageValidator: FreshValidator } = await import(
      '../../../src/server/message-validator.js'
    );
    const freshValidator = new FreshValidator();

    class AnyDto {
      value?: string;
    }

    await expect(freshValidator.validate({}, AnyDto, 'ch')).rejects.toMatchObject({
      name: 'ConfigurationError',
      message: expect.stringContaining('class-validator and class-transformer are required'),
    });
  });
});
