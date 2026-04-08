export class CreateOrderCommand {
  constructor(
    public readonly productId: string,
    public readonly quantity: number,
  ) {}
}
