// src/utils/error-helpers.ts

/**
 * Check if an error is a module-not-found error (CommonJS + ESM).
 */
export function isModuleNotFoundError(e: unknown): boolean {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    const code = (e as Record<string, unknown>).code;
    if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') {
      return true;
    }
  }
  if (e instanceof Error) {
    return (
      e.message.includes('Cannot find module') || e.message.includes('Cannot find package')
    );
  }
  return false;
}

/**
 * True when `waitForConnection: false` should retry bootstrap (broker likely down).
 * Local validation / binding errors should not enter the reconnect loop.
 *
 * Uses constructor names and optional `code` fields so tests can mock `kubemq-js` without
 * exporting every error class.
 */
export function isConnectionError(err: unknown): boolean {
  if (err === null || typeof err !== 'object') return false;
  const ctor = (err as object).constructor?.name ?? '';
  if (
    ctor === 'ConnectionError' ||
    ctor === 'TransientError' ||
    ctor === 'BufferFullError' ||
    ctor === 'StreamBrokenError' ||
    ctor === 'RetryExhaustedError'
  ) {
    return true;
  }
  const code = (err as { code?: string }).code;
  if (
    code === 'UNAVAILABLE' ||
    code === 'DEADLINE_EXCEEDED' ||
    code === 'RESOURCE_EXHAUSTED'
  ) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|UNAVAILABLE|connection refused/i.test(msg)) {
    return true;
  }
  return false;
}

/**
 * Normalize an unknown thrown value to an Error (M-7).
 */
export function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/**
 * Extract a message string from an unknown error value.
 * Shorthand for the common `err instanceof Error ? err.message : String(err)` pattern.
 */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
