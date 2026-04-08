export class OrderCreatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly product: string,
    public readonly quantity: number,
  ) {}
}
