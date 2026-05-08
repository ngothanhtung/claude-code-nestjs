import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category/category.entity';
import { Product } from './product/product.entity';
import { Order } from './order/order.entity';
import { OrderItem } from './order/order-item.entity';
import { CategoryService } from './category/category.service';
import { ProductService } from './product/product.service';
import { OrderService } from './order/order.service';
import { CategoryController } from './category/category.controller';
import { ProductController } from './product/product.controller';
import { OrderController } from './order/order.controller';
import { BullModule } from '@nestjs/bull';
import { MailService } from './queues/mail/mail.service';
import { MailProcessor } from './queues/mail/mail.processor';
import { EventsGateway } from './realtime/events.gateway';
import { TasksService } from './tasks/tasks.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Category, Product, Order, OrderItem]),
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  controllers: [CategoryController, ProductController, OrderController],
  providers: [
    CategoryService,
    ProductService,
    OrderService,
    MailService,
    MailProcessor,
    EventsGateway,
    TasksService,
  ],
  exports: [TypeOrmModule],
})
export class EcommerceModule {}
