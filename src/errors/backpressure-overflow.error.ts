export class BackpressureOverflowError extends Error {
  readonly name = 'BackpressureOverflowError';
  constructor(
    public readonly channel: string,
    public readonly maxQueueDepth: number,
  ) {
    super(
      `Backpressure queue exceeded max depth (${maxQueueDepth}) on "${channel}" ` +
        `(queue: nack/requeue; non-queue: dropped)`,
    );
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
