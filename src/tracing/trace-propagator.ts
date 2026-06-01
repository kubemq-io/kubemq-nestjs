import { Logger } from '@nestjs/common';
import { TAG_TRACEPARENT } from '../constants.js';

let otelApi: typeof import('@opentelemetry/api') | null = null;
let otelLoadAttempted = false;

function loadOtel(): typeof import('@opentelemetry/api') | null {
  return otelApi;
}

async function ensureOtelLoaded(): Promise<typeof import('@opentelemetry/api') | null> {
  if (otelApi) return otelApi;
  if (otelLoadAttempted) return null;
  otelLoadAttempted = true;
  try {
    otelApi = await import('@opentelemetry/api');
    return otelApi;
  } catch {
    return null;
  }
}

export { loadOtel };

const logger = new Logger('TracePropagator');

export class TagCarrier {
  constructor(public tags: Record<string, string>) {}
  get(key: string): string | undefined { return this.tags[key]; }
  set(key: string, value: string): void { this.tags[key] = value; }
  keys(): string[] { return Object.keys(this.tags); }
}

const tagGetter = {
  get(carrier: TagCarrier, key: string): string | undefined { return carrier.get(key); },
  keys(carrier: TagCarrier): string[] { return carrier.keys(); },
};

const tagSetter = {
  set(carrier: TagCarrier, key: string, value: string): void { carrier.set(key, value); },
};

export class TracePropagator {
  /** Call once at server/client startup to eagerly load @opentelemetry/api if configured. */
  static async initialize(tracerProvider?: unknown): Promise<void> {
    if (tracerProvider) await ensureOtelLoaded();
  }

  static injectIntoTags(tags: Record<string, string>, tracerProvider?: unknown): void {
    if (!tracerProvider) return;
    const api = loadOtel();
    if (!api) return;

    try {
      const carrier = new TagCarrier(tags);
      api.propagation.inject(api.context.active(), carrier, tagSetter);
    } catch (err) {
      logger.debug?.(`Failed to inject trace context: ${err}`);
    }
  }

  static extractContext(
    tags: Record<string, string> | undefined,
    tracerProvider?: unknown,
  ): unknown {
    if (!tracerProvider || !tags) return undefined;
    const api = loadOtel();
    if (!api) return undefined;

    const traceparent = tags[TAG_TRACEPARENT];
    if (!traceparent) return undefined;

    try {
      const carrier = new TagCarrier(tags);
      return api.propagation.extract(api.context.active(), carrier, tagGetter);
    } catch (err) {
      logger.debug?.(`Failed to extract trace context: ${err}`);
      return undefined;
    }
  }

  /**
   * Serialize the current OTel span context into bytes for the proto Span field (REQ-9 AC6).
   * Used for commands/queries where Request.Span (bytes, field 11) must be populated.
   */
  static serializeSpanContext(tracerProvider?: unknown): Uint8Array | undefined {
    if (!tracerProvider) return undefined;
    const api = loadOtel();
    if (!api) return undefined;

    try {
      const span = api.trace.getSpan(api.context.active());
      if (!span) return undefined;
      const ctx = span.spanContext();
      const json = JSON.stringify({
        traceId: ctx.traceId,
        spanId: ctx.spanId,
        traceFlags: ctx.traceFlags,
        traceState: ctx.traceState?.serialize(),
      });
      return new TextEncoder().encode(json);
    } catch {
      return undefined;
    }
  }

  static getTraceTagsFromContext(tracerProvider?: unknown): Record<string, string> {
    if (!tracerProvider) return {};
    const api = loadOtel();
    if (!api) return {};

    const tags: Record<string, string> = {};
    try {
      const carrier = new TagCarrier(tags);
      api.propagation.inject(api.context.active(), carrier, tagSetter);
    } catch {
      // no-op
    }
    return tags;
  }
}
