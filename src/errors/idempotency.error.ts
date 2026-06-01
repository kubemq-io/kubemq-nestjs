export class DuplicateMessageError extends Error {
  readonly name = 'DuplicateMessageError';
  constructor(
    public readonly channel: string,
    public readonly idempotencyKey: string,
  ) {
    super(
      `Duplicate message on "${channel}" with idempotency key "${idempotencyKey}"`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
