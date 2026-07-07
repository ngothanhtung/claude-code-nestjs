import { Module } from '@nestjs/common';

import { ProductionController } from './production/production.controller';
import { ProductionService } from './production/production.services';
import { SalesController } from './sales/sales.controller';
import { SalesService } from './sales/sales.services';

@Module({
  imports: [],
  controllers: [ProductionController, SalesController],
  providers: [ProductionService, SalesService],
})
export class AdventureWorksModule {}
