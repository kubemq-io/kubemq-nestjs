export class DeadLetterError extends Error {
  readonly name = 'DeadLetterError';
  constructor(
    public readonly sourceChannel: string,
    public readonly dlqChannel: string,
    public readonly retryCount: number,
    public readonly originalError: Error,
  ) {
    super(
      `Message routed to DLQ "${dlqChannel}" after ${retryCount} retries on "${sourceChannel}"`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
