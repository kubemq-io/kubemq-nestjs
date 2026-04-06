import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { CommandHandler } from '../../../src/decorators/command-handler.decorator.js';
import { QueryHandler } from '../../../src/decorators/query-handler.decorator.js';
import { EventHandler } from '../../../src/decorators/event-handler.decorator.js';
import { EventStoreHandler } from '../../../src/decorators/event-store-handler.decorator.js';
import { QueueHandler } from '../../../src/decorators/queue-handler.decorator.js';
import { KUBEMQ_HANDLER_METADATA } from '../../../src/constants.js';

// NestJS stores pattern metadata on class methods.
// We need to use the same keys NestJS uses internally.
const _PATTERN_METADATA = 'microservices:pattern';
const _PATTERN_HANDLER_METADATA = 'microservices:handler_type';

function getMetadata(target: any, method: string) {
  const fn = target.prototype[method];
  const kubemqMeta = Reflect.getMetadata(KUBEMQ_HANDLER_METADATA, fn);
  return kubemqMeta;
}

describe('Decorators', () => {
  // 16.54: @CommandHandler metadata
  it('@CommandHandler stores command type metadata', () => {
    class TestController {
      @CommandHandler('orders.create')
      handleCreate(_data: any) { return { ok: true }; }
    }

    const meta = getMetadata(TestController, 'handleCreate');
    expect(meta).toBeDefined();
    expect(meta.type).toBe('command');
    expect(meta.channels).toEqual(['orders.create']);
  });

  // 16.55: @QueryHandler metadata
  it('@QueryHandler stores query type metadata', () => {
    class TestController {
      @QueryHandler('orders.get')
      handleGet(_data: any) { return { order: {} }; }
    }

    const meta = getMetadata(TestController, 'handleGet');
    expect(meta).toBeDefined();
    expect(meta.type).toBe('query');
    expect(meta.channels).toEqual(['orders.get']);
  });

  // 16.56: @EventHandler metadata
  it('@EventHandler stores event type metadata', () => {
    class TestController {
      @EventHandler('orders.updated')
      handleUpdated(_data: any) {}
    }

    const meta = getMetadata(TestController, 'handleUpdated');
    expect(meta).toBeDefined();
    expect(meta.type).toBe('event');
    expect(meta.channels).toEqual(['orders.updated']);
  });

  // 16.57: @EventStoreHandler metadata
  it('@EventStoreHandler stores event_store type metadata', () => {
    class TestController {
      @EventStoreHandler('orders.history')
      handleHistory(_data: any) {}
    }

    const meta = getMetadata(TestController, 'handleHistory');
    expect(meta).toBeDefined();
    expect(meta.type).toBe('event_store');
    expect(meta.channels).toEqual(['orders.history']);
  });

  // 16.58: @QueueHandler metadata
  it('@QueueHandler stores queue type metadata', () => {
    class TestController {
      @QueueHandler('orders.process')
      handleProcess(_data: any) {}
    }

    const meta = getMetadata(TestController, 'handleProcess');
    expect(meta).toBeDefined();
    expect(meta.type).toBe('queue');
    expect(meta.channels).toEqual(['orders.process']);
  });

  // 16.59: Multi-pattern support
  it('multi-pattern: @EventHandler with array creates registrations for all channels', () => {
    class TestController {
      @EventHandler(['ch1', 'ch2', 'ch3'])
      handleMulti(_data: any) {}
    }

    const meta = getMetadata(TestController, 'handleMulti');
    expect(meta).toBeDefined();
    expect(meta.type).toBe('event');
    expect(meta.channels).toEqual(['ch1', 'ch2', 'ch3']);
  });

  // 16.60: Options passthrough
  it('options passthrough: @CommandHandler preserves group and other options', () => {
    class TestController {
      @CommandHandler('orders.create', { group: 'g1', maxConcurrent: 5 })
      handleCreate(_data: any) { return { ok: true }; }
    }

    const meta = getMetadata(TestController, 'handleCreate');
    expect(meta).toBeDefined();
    expect(meta.type).toBe('command');
    expect(meta.group).toBe('g1');
    expect(meta.maxConcurrent).toBe(5);
  });
});
