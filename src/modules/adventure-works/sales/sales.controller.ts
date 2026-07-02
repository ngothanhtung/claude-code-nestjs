import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PositiveIdParamDto } from '../dto/positive-id-param.dto';
import { SalesService } from './sales.services';

@ApiTags('AdventureWorks Sales')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('orders')
  @ApiOperation({ summary: 'List sales orders' })
  @ApiOkResponse({ description: 'Paginated sales orders' })
  findOrders(@Query() query: PaginationQueryDto) {
    return this.salesService.findOrders(query);
  }

  @Get('orders/:id/details')
  @ApiOperation({ summary: 'List details for a sales order' })
  @ApiOkResponse({ description: 'Paginated sales order details' })
  @ApiNotFoundResponse({ description: 'Sales order not found' })
  findOrderDetails(
    @Param() { id }: PositiveIdParamDto,
    @Query() query: PaginationQueryDto,
  ) {
    return this.salesService.findOrderDetails(id, query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get a sales order by ID' })
  @ApiOkResponse({ description: 'Sales order found' })
  @ApiNotFoundResponse({ description: 'Sales order not found' })
  findOrder(@Param() { id }: PositiveIdParamDto) {
    return this.salesService.findOrder(id);
  }

  @Get('customers')
  @ApiOperation({ summary: 'List customers' })
  @ApiOkResponse({ description: 'Paginated customers' })
  findCustomers(@Query() query: PaginationQueryDto) {
    return this.salesService.findCustomers(query);
  }

  @Get('customers/:id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiOkResponse({ description: 'Customer found' })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  findCustomer(@Param() { id }: PositiveIdParamDto) {
    return this.salesService.findCustomer(id);
  }
}
