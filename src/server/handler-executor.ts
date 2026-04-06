import type { Observable } from 'rxjs';
import { firstValueFrom, timeout, defaultIfEmpty } from 'rxjs';

/**
 * Tracks in-flight handler work and provides bounded drain on shutdown.
 */
export class HandlerExecutor {
  private readonly inflight = new Set<Promise<unknown>>();

  /**
   * Wrap async handler work; removes from the set when the promise settles.
   */
  track<T>(work: () => Promise<T>): Promise<T> {
    const p = work();
    this.inflight.add(p);
    return p.finally(() => {
      this.inflight.delete(p);
    }) as Promise<T>;
  }

  /**
   * Command/query path: EMPTY Observable yields RxJS EmptyError (no defaultIfEmpty).
   */
  executeRpc(result$: Observable<unknown>, timeoutMs: number): Promise<unknown> {
    return firstValueFrom(result$.pipe(timeout(timeoutMs)));
  }

  /**
   * Event/queue path: empty stream completes as undefined.
   */
  executeWithDefault(result$: Observable<unknown>, timeoutMs: number): Promise<unknown> {
    return firstValueFrom(result$.pipe(timeout(timeoutMs), defaultIfEmpty(undefined)));
  }

  /**
   * Wait for in-flight work up to `timeoutMs`, then resolve (does not cancel work).
   */
  async drain(timeoutMs: number): Promise<void> {
    if (this.inflight.size === 0) return;
    await Promise.race([
      Promise.allSettled([...this.inflight]),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  }
}
