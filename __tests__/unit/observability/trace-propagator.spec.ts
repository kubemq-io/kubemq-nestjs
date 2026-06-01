import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TAG_TRACEPARENT } from '../../../src/constants.js';

const { mockSpanContext, mockSpan, mockTrace, mockContext, mockPropagation } = vi.hoisted(() => {
  const mockSpanContext = {
    traceId: 'abc123def456789012345678901234ab',
    spanId: 'abc123def4567890',
    traceFlags: 1,
    traceState: { serialize: () => 'key=value' },
  };
  const mockSpan = {
    spanContext: vi.fn(() => mockSpanContext),
  };
  return {
    mockSpanContext,
    mockSpan,
    mockTrace: { getSpan: vi.fn((): any => mockSpan) },
    mockContext: { active: vi.fn(() => ({})) },
    mockPropagation: {
      inject: vi.fn((_ctx: unknown, carrier: any, setter: any) => {
        setter.set(carrier, 'traceparent', '00-abc123-def456-01');
      }),
      extract: vi.fn(() => ({ _extracted: true })),
    },
  };
});

vi.mock('@opentelemetry/api', () => ({
  trace: mockTrace,
  context: mockContext,
  propagation: mockPropagation,
  ROOT_CONTEXT: {},
}));

import { TracePropagator, TagCarrier } from '../../../src/tracing/trace-propagator.js';

describe('TagCarrier', () => {
  it('get/set/keys works correctly', () => {
    const carrier = new TagCarrier({ key1: 'val1' });
    expect(carrier.get('key1')).toBe('val1');
    expect(carrier.get('missing')).toBeUndefined();

    carrier.set('key2', 'val2');
    expect(carrier.get('key2')).toBe('val2');
    expect(carrier.keys()).toContain('key1');
    expect(carrier.keys()).toContain('key2');
  });
});

describe('TracePropagator (no tracerProvider)', () => {
  it('injectIntoTags is a no-op when tracerProvider is undefined', () => {
    const tags: Record<string, string> = {};
    TracePropagator.injectIntoTags(tags, undefined);
    expect(Object.keys(tags)).toHaveLength(0);
  });

  it('extractContext returns undefined when tracerProvider is undefined', () => {
    const tags = { [TAG_TRACEPARENT]: '00-abc-def-01' };
    const ctx = TracePropagator.extractContext(tags, undefined);
    expect(ctx).toBeUndefined();
  });

  it('extractContext returns undefined when tags have no traceparent', () => {
    const tracerProvider = {};
    const ctx = TracePropagator.extractContext({}, tracerProvider);
    expect(ctx).toBeUndefined();
  });

  it('extractContext returns undefined when tags are undefined', () => {
    expect(TracePropagator.extractContext(undefined, {})).toBeUndefined();
  });

  it('serializeSpanContext returns undefined without tracerProvider', () => {
    expect(TracePropagator.serializeSpanContext(undefined)).toBeUndefined();
  });

  it('getTraceTagsFromContext returns empty object without tracerProvider', () => {
    expect(TracePropagator.getTraceTagsFromContext(undefined)).toEqual({});
  });
});

describe('TracePropagator (with OTel)', () => {
  let mod: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mod = await import('../../../src/tracing/trace-propagator.js');
  });

  it('initialize loads @opentelemetry/api when tracerProvider is given', async () => {
    await mod.TracePropagator.initialize({});
    expect(mod.loadOtel()).not.toBeNull();
  });

  it('initialize without tracerProvider does not load otel', async () => {
    await mod.TracePropagator.initialize(undefined);
    expect(mod.loadOtel()).toBeNull();
  });

  it('injectIntoTags calls propagation.inject and populates tags', async () => {
    await mod.TracePropagator.initialize({});
    const tags: Record<string, string> = {};
    mod.TracePropagator.injectIntoTags(tags, {});
    expect(mockPropagation.inject).toHaveBeenCalledTimes(1);
    expect(tags['traceparent']).toBe('00-abc123-def456-01');
  });

  it('injectIntoTags returns tags unchanged when otel not loaded', async () => {
    const tags: Record<string, string> = { existing: 'value' };
    mod.TracePropagator.injectIntoTags(tags, {});
    expect(tags).toEqual({ existing: 'value' });
    expect(mockPropagation.inject).not.toHaveBeenCalled();
  });

  it('injectIntoTags catches injection errors silently', async () => {
    await mod.TracePropagator.initialize({});
    mockPropagation.inject.mockImplementationOnce(() => {
      throw new Error('inject fail');
    });
    const tags: Record<string, string> = {};
    expect(() => mod.TracePropagator.injectIntoTags(tags, {})).not.toThrow();
  });

  it('extractContext calls propagation.extract with traceparent tag', async () => {
    await mod.TracePropagator.initialize({});
    const tags = { [TAG_TRACEPARENT]: '00-abc123-def456-01' };
    const ctx = mod.TracePropagator.extractContext(tags, {});
    expect(mockPropagation.extract).toHaveBeenCalledTimes(1);
    expect(ctx).toEqual({ _extracted: true });
  });

  it('extractContext returns undefined when tags have no traceparent', async () => {
    await mod.TracePropagator.initialize({});
    const ctx = mod.TracePropagator.extractContext({}, {});
    expect(ctx).toBeUndefined();
    expect(mockPropagation.extract).not.toHaveBeenCalled();
  });

  it('extractContext catches extraction errors and returns undefined', async () => {
    await mod.TracePropagator.initialize({});
    mockPropagation.extract.mockImplementationOnce(() => {
      throw new Error('extract fail');
    });
    const tags = { [TAG_TRACEPARENT]: '00-abc123-def456-01' };
    expect(mod.TracePropagator.extractContext(tags, {})).toBeUndefined();
  });

  it('serializeSpanContext returns Uint8Array with span context JSON', async () => {
    await mod.TracePropagator.initialize({});
    const result = mod.TracePropagator.serializeSpanContext({});
    expect(result).toBeInstanceOf(Uint8Array);
    const json = JSON.parse(new TextDecoder().decode(result));
    expect(json.traceId).toBe('abc123def456789012345678901234ab');
    expect(json.spanId).toBe('abc123def4567890');
    expect(json.traceFlags).toBe(1);
    expect(json.traceState).toBe('key=value');
  });

  it('serializeSpanContext returns undefined when no active span', async () => {
    await mod.TracePropagator.initialize({});
    mockTrace.getSpan.mockReturnValueOnce(null);
    expect(mod.TracePropagator.serializeSpanContext({})).toBeUndefined();
  });

  it('serializeSpanContext returns undefined on error', async () => {
    await mod.TracePropagator.initialize({});
    mockTrace.getSpan.mockImplementationOnce(() => {
      throw new Error('span fail');
    });
    expect(mod.TracePropagator.serializeSpanContext({})).toBeUndefined();
  });

  it('serializeSpanContext handles undefined traceState', async () => {
    await mod.TracePropagator.initialize({});
    mockSpan.spanContext.mockReturnValueOnce({
      ...mockSpanContext,
      traceState: undefined,
    });
    const result = mod.TracePropagator.serializeSpanContext({});
    expect(result).toBeInstanceOf(Uint8Array);
    const json = JSON.parse(new TextDecoder().decode(result));
    expect(json.traceState).toBeUndefined();
  });

  it('getTraceTagsFromContext returns tags with traceparent', async () => {
    await mod.TracePropagator.initialize({});
    const tags = mod.TracePropagator.getTraceTagsFromContext({});
    expect(tags['traceparent']).toBe('00-abc123-def456-01');
    expect(mockPropagation.inject).toHaveBeenCalledTimes(1);
  });

  it('getTraceTagsFromContext returns empty object when otel not loaded', async () => {
    expect(mod.TracePropagator.getTraceTagsFromContext({})).toEqual({});
  });

  it('getTraceTagsFromContext catches errors and returns empty tags', async () => {
    await mod.TracePropagator.initialize({});
    mockPropagation.inject.mockImplementationOnce(() => {
      throw new Error('inject fail');
    });
    expect(mod.TracePropagator.getTraceTagsFromContext({})).toEqual({});
  });
});

describe('TracePropagator (OTel unavailable)', () => {
  it('initialize does not throw when @opentelemetry/api is unavailable', async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.doMock('@opentelemetry/api', () => {
      throw new Error('Cannot find module');
    });
    const m = await import('../../../src/tracing/trace-propagator.js');
    await m.TracePropagator.initialize({});
    expect(m.loadOtel()).toBeNull();
  });
});
