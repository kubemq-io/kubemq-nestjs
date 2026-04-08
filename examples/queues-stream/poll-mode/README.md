# Queue Stream — Poll Mode

Demonstrates non-streaming queue polling via `receiveQueueMessages()`. This is a simple pull-based approach where the client explicitly polls for messages at its own pace, with configurable batch size.

## What This Demonstrates

- `receiveQueueMessages()` for pull-based polling (non-streaming)
- Configurable `maxMessages` for batch sizing
- Sequential poll loops with `waitTimeoutSeconds` for timeout control
- Individual `msg.ack()` on polled messages

## Prerequisites

- KubeMQ server running (default: `localhost:50000`, override with `KUBEMQ_ADDRESS`)

## Run

```bash
npx tsx examples/queues-stream/poll-mode/main.ts
```

## Expected Output

```
[PollModeExample] Application initialized
[PollModeService] Sending 5 messages to queue...
[PollModeService] Poll 1: received 3 messages
[PollModeService]   msg seq=1: {"item":1}
[PollModeService]   msg seq=2: {"item":2}
[PollModeService]   msg seq=3: {"item":3}
[PollModeService] Poll 2: received 2 messages
[PollModeService]   msg seq=4: {"item":4}
[PollModeService]   msg seq=5: {"item":5}
[PollModeService] All messages consumed via polling
```

## Key Code

```typescript
const raw = this.client.unwrap<KubeMQClient>();
while (totalReceived < 5) {
  const messages = await raw.receiveQueueMessages({
    channel: CHANNEL,
    maxMessages: 3,
    waitTimeoutSeconds: 5,
  });
  for (const msg of messages) {
    await msg.ack();
    totalReceived++;
  }
}
```
