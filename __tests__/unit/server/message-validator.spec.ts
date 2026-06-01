import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MessageValidator', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe('when validation deps are unavailable', () => {
    it('throws ConfigurationError when class-validator/class-transformer cannot be loaded', async () => {
      vi.doMock('class-validator', () => {
        throw new Error('Cannot find module');
      });
      vi.doMock('class-transformer', () => {
        throw new Error('Cannot find module');
      });

      const { MessageValidator } = await import(
        '../../../src/server/message-validator.js'
      );
      const { ConfigurationError } = await import(
        '../../../src/errors/configuration.error.js'
      );

      class TestDto {
        name!: string;
      }
      const validator = new MessageValidator();
      await expect(
        validator.validate({ name: 'test' }, TestDto, 'orders'),
      ).rejects.toBeInstanceOf(ConfigurationError);
    });

    it('error message mentions install instructions', async () => {
      vi.doMock('class-validator', () => {
        throw new Error('Cannot find module');
      });
      vi.doMock('class-transformer', () => {
        throw new Error('Cannot find module');
      });

      const { MessageValidator } = await import(
        '../../../src/server/message-validator.js'
      );

      class TestDto {
        name!: string;
      }
      const validator = new MessageValidator();
      await expect(
        validator.validate({}, TestDto, 'ch'),
      ).rejects.toThrow(/class-validator and class-transformer are required/);
    });
  });

  describe('data with toJSON()', () => {
    it('calls toJSON() on data before validation', async () => {
      vi.doUnmock('class-validator');
      vi.doUnmock('class-transformer');

      const { MessageValidator } = await import(
        '../../../src/server/message-validator.js'
      );
      const cv = await import('class-validator');

      class NameDto {
        name!: string;
      }
      cv.IsString()(NameDto.prototype, 'name');

      const data = { toJSON: () => ({ name: 'converted' }) };
      const validator = new MessageValidator();
      const result = await validator.validate(data, NameDto, 'test');
      expect(result.valid).toBe(true);
    });
  });
});
