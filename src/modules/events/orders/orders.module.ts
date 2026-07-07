import { Module } from '@nestjs/common';
import { OrderCreatedListener } from './listeners';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderCreatedListener],
})
export class OrdersModule {}
