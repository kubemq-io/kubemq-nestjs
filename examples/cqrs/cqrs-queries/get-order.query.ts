export class GetOrderQuery {
  constructor(public readonly orderId: string) {}
}

export class GetOrderResult {
  constructor(
    public readonly orderId: string,
    public readonly product: string,
    public readonly status: string,
  ) {}
}
