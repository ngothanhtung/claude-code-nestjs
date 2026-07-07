export class OrderCreatedEvent {
  id: number;
  name: string;
  description: string;
}

export class OrderLogEvent {
  constructor(id: number) {
    this.id = id;
  }
  id: number;
}
