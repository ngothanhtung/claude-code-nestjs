import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PositiveIdParamDto } from '../dto/positive-id-param.dto';
import { ProductionService } from './production.services';

@ApiTags('AdventureWorks Production')
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('products')
  @ApiOperation({ summary: 'List products' })
  @ApiOkResponse({ description: 'Paginated products' })
  findProducts(@Query() query: PaginationQueryDto) {
    return this.productionService.findProducts(query);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiOkResponse({ description: 'Product found' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findProduct(@Param() { id }: PositiveIdParamDto) {
    return this.productionService.findProduct(id);
  }

  @Get('product-categories')
  @ApiOperation({ summary: 'List product categories' })
  @ApiOkResponse({ description: 'Paginated product categories' })
  findProductCategories(@Query() query: PaginationQueryDto) {
    return this.productionService.findProductCategories(query);
  }

  @Get('product-subcategories')
  @ApiOperation({ summary: 'List product subcategories' })
  @ApiOkResponse({ description: 'Paginated product subcategories' })
  findProductSubcategories(@Query() query: PaginationQueryDto) {
    return this.productionService.findProductSubcategories(query);
  }
}
