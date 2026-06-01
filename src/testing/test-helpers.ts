import { randomUUID } from 'node:crypto';

export function createCorrelationContext(
  correlationId?: string,
  causationId?: string,
): { correlationId: string; causationId: string } {
  return {
    correlationId: correlationId ?? randomUUID(),
    causationId: causationId ?? randomUUID(),
  };
}

export function createTraceContext(
  traceId?: string,
  spanId?: string,
): { traceparent: string; tracestate: string } {
  const tid = traceId ?? randomUUID().replace(/-/g, '');
  const sid = spanId ?? randomUUID().replace(/-/g, '').slice(0, 16);
  return {
    traceparent: `00-${tid}-${sid}-01`,
    tracestate: '',
  };
}
