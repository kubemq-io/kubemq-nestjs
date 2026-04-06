import type { Logger } from '@nestjs/common';
import type { ReconnectionPolicy } from 'kubemq-js';

import { errorMessage } from '../utils/error-helpers.js';

/** Mirrors {@link DEFAULT_RECONNECTION_POLICY} from kubemq-js (inlined so unit mocks need not export it). */
const FALLBACK_RECONNECTION_POLICY: ReconnectionPolicy = Object.freeze({
  maxAttempts: -1,
  initialDelayMs: 500,
  maxDelayMs: 30_000,
  multiplier: 2.0,
  jitter: 'full',
});

function mergePolicy(user?: ReconnectionPolicy): ReconnectionPolicy {
  return user ?? FALLBACK_RECONNECTION_POLICY;
}

/**
 * Nest bootstrap reconnection loop when `waitForConnection === false`.
 * Uses {@link ReconnectionPolicy} from server options (or kubemq-js defaults).
 */
export class ReconnectManager {
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** Failed reconnect attempts since the last success (used for backoff). */
  private attempt = 0;
  private _closing = false;

  constructor(
    private readonly getPolicy: () => ReconnectionPolicy | undefined,
    private readonly logger: Logger,
  ) {}

  get isClosing(): boolean {
    return this._closing;
  }

  markClosing(): void {
    this._closing = true;
  }

  cancelLoop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._closing = true;
  }

  resetAfterSuccess(): void {
    this.attempt = 0;
  }

  /**
   * Start the first reconnect after initial `listen()` failure.
   */
  startLoop(connectFn: () => Promise<void>, onExhausted: () => void): void {
    if (this._closing) return;
    this.scheduleRetry(connectFn, onExhausted);
  }

  private scheduleRetry(connectFn: () => Promise<void>, onExhausted: () => void): void {
    const policy = mergePolicy(this.getPolicy());
    const maxAttempts = policy.maxAttempts;
    const unlimited = maxAttempts < 0;

    if (!unlimited && this.attempt >= maxAttempts) {
      this.logger.error(
        'Reconnection attempts exhausted. Server will not recover automatically.',
      );
      onExhausted();
      return;
    }

    const delay = Math.min(
      policy.initialDelayMs * Math.pow(policy.multiplier, this.attempt),
      policy.maxDelayMs,
    );

    this.timer = setTimeout(() => {
      this.timer = null;
      if (this._closing) return;

      connectFn()
        .then(() => {
          this.resetAfterSuccess();
        })
        .catch((err: unknown) => {
          this.logger.error(
            `Reconnection attempt ${this.attempt + 1}${unlimited ? '' : `/${maxAttempts}`} failed: ${errorMessage(err)}`,
          );
          this.attempt++;
          if (!this._closing) {
            this.scheduleRetry(connectFn, onExhausted);
          }
        });
    }, delay);
    this.timer.unref();
  }
}
