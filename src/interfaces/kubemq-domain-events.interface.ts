export interface KubeMQServerEvents {
  deadLetter: {
    channel: string;
    dlqChannel: string;
    messageId: string;
    error: string;
    retryCount: number;
    sendError?: string;
  };
}

export interface KubeMQClientEvents {
  circuitBreaker: {
    state: 'closed' | 'open' | 'half-open';
    failures: number;
  };
}
