export interface KubeMQSerializer {
  serialize(value: unknown): Uint8Array;
  readonly contentType?: string; // NEW (M-35) -- optional content type hint
}

export interface KubeMQDeserializer {
  deserialize(data: Uint8Array, tags?: Record<string, string>): unknown;
}
