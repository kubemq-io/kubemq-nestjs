export class MessageValidationError extends Error {
  readonly name = 'MessageValidationError';
  constructor(
    public readonly channel: string,
    public readonly violations: Array<{
      property: string;
      constraints: Record<string, string>;
    }>,
  ) {
    super(
      `Message validation failed on "${channel}": ${violations.length} violation(s)`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
