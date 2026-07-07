import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent, OrderLogEvent } from '../events';

@Injectable()
export class OrderCreatedListener {
  @OnEvent('order.created')
  handleOrderCreatedEvent(event: OrderCreatedEvent) {
    // handle and process "OrderCreatedEvent" event
    console.log(event);
  }

  @OnEvent('order.log')
  handleOrderLogEvent(event: OrderLogEvent) {
    // handle and process "OrderCreatedEvent" event
    console.log(event);
  }
}
