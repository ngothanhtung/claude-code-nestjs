import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly repo: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const totalAmount = dto.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );

      const order = manager.create(Order, {
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        shippingAddress: dto.shippingAddress,
        totalAmount,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await manager.save(order);

      const orderItems = dto.items.map((item) =>
        manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }),
      );
      await manager.save(orderItems);

      for (const item of dto.items) {
        const result = await manager.decrement(
          'products',
          { id: item.productId },
          'stock',
          item.quantity,
        );
        if (result.affected === 0) {
          throw new NotFoundException(
            `Product with ID "${item.productId}" not found`,
          );
        }
      }

      return this.findById(savedOrder.id) as Promise<Order>;
    });
  }

  findAll(): Promise<Order[]> {
    return this.repo.find({
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const result = await this.repo.update(id, { status: dto.status });
    if (result.affected === 0) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return this.findById(id) as Promise<Order>;
  }
}
