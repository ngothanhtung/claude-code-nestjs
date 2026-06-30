import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AW_CONNECTION } from '../aw.constants';

type ProductRow = Record<string, unknown>;

@Injectable()
export class ProductionService {
  constructor(
    @InjectDataSource(AW_CONNECTION)
    private readonly dataSource: Pick<DataSource, 'query'>,
  ) {}

  async findProducts(): Promise<ProductRow[]> {
    return this.dataSource.query<ProductRow[]>(
      'SELECT * FROM [Production].[Product] ORDER BY [Name]',
    );
  }
}
