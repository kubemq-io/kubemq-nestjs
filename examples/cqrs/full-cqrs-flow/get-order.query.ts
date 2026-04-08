export class GetOrderQuery {
  constructor(public readonly orderId: string) {}
}

export class GetOrderResult {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly status: string,
  ) {}
}
