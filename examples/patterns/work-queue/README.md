# Work Queue Pattern (Competing Consumers)

Demonstrates the work queue (competing consumers) pattern using `@QueueHandler` with a `group` option. Multiple workers in the same group share the workload — each queue message is delivered to exactly one worker.

## What This Demonstrates

- `@QueueHandler` with `group` for competing-consumer delivery
- `KubeMQRecord.asQueue()` for enqueuing messages via `client.emit()`
- `KubeMQQueueContext` for accessing queue metadata (sequence, receiveCount)
- Auto-ack on successful processing (default behavior)

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/patterns/work-queue/main.ts
```

## Expected Output

```
[WorkQueueExample] KubeMQ microservice started with work-queue consumer
[ProducerService] Enqueuing job #1: resize-image
[ProducerService] Enqueuing job #2: send-email
[ProducerService] Enqueuing job #3: generate-report
[ProducerService] Enqueued 3 jobs
[Worker] Processing job #1 (task: resize-image) on nestjs-patterns.work-queue (seq: 1, deliveries: 1)
[Worker] Processing job #2 (task: send-email) on nestjs-patterns.work-queue (seq: 2, deliveries: 1)
[Worker] Processing job #3 (task: generate-report) on nestjs-patterns.work-queue (seq: 3, deliveries: 1)
```

## Key Code

**Worker with consumer group:**

```typescript
@QueueHandler('nestjs-patterns.work-queue', {
  group: 'workers',
  maxMessages: 1,
  waitTimeoutSeconds: 30,
})
async handleJob(data: { jobId: number; task: string }, ctx: KubeMQQueueContext): Promise<void> {
  this.logger.log(`Processing job #${data.jobId} (task: ${data.task})`);
}
```

**Producer enqueues via KubeMQRecord:**

```typescript
await firstValueFrom(
  this.client.emit('nestjs-patterns.work-queue', new KubeMQRecord(job).asQueue()),
);
```
