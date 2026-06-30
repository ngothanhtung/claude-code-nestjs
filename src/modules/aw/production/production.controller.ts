import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductionService } from './production.services';

@ApiTags('AW Production')
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('products')
  @ApiOperation({
    summary: 'List all products from [Production].[Product] ordered by Name',
  })
  @ApiOkResponse({ description: 'All production products ordered by Name' })
  findProducts() {
    return this.productionService.findProducts();
  }
}
