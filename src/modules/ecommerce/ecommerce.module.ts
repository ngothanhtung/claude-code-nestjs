import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryController } from './category/category.controller';
import { Category } from './category/category.entity';
import { CategoryService } from './category/category.service';
import { CommentController } from './comment/comment.controller';
import { Comment } from './comment/comment.entity';
import { CommentService } from './comment/comment.service';
import { CustomerController } from './customer/customer.controller';
import { Customer } from './customer/customer.entity';
import { CustomerService } from './customer/customer.service';
import { EmployeeController } from './employee/employee.controller';
import { Employee } from './employee/employee.entity';
import { EmployeeService } from './employee/employee.service';
import { GroupController } from './group/group.controller';
import { Group } from './group/group.entity';
import { GroupService } from './group/group.service';
import { OrderItem } from './order/order-item.entity';
import { OrderController } from './order/order.controller';
import { Order } from './order/order.entity';
import { OrderService } from './order/order.service';
import { PostController } from './post/post.controller';
import { Post } from './post/post.entity';
import { PostService } from './post/post.service';
import { ProductController } from './product/product.controller';
import { Product } from './product/product.entity';
import { ProductService } from './product/product.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      Category,
      Product,
      Order,
      OrderItem,
      Customer,
      Employee,
      Comment,
      Post,
      Group,
    ]),
  ],
  controllers: [
    CategoryController,
    ProductController,
    OrderController,
    CustomerController,
    EmployeeController,
    GroupController,
    PostController,
    CommentController,
  ],
  providers: [
    CategoryService,
    ProductService,
    OrderService,
    CustomerService,
    EmployeeService,
    GroupService,
    PostService,
    CommentService,
  ],
  exports: [TypeOrmModule],
})
export class EcommerceModule {}
