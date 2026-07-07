import { Body, Controller, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto';
import { OrdersService } from './orders.service';

@Controller('queue/orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }
}
