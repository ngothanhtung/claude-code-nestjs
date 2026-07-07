import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { PaginationQueryDto } from '../dto/pagination-query.dto';
import {
  DatabaseRow,
  PaginatedResult,
} from '../interfaces/paginated-result.interface';

interface CountRow {
  total: number | string;
}

@Injectable()
export class ProductionService {
  constructor(
    @InjectDataSource('mssql')
    private readonly dataSource: DataSource,
  ) {}

  async findProducts(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<DatabaseRow>> {
    return this.findPaginated(
      `SELECT
        ProductID, Name, ProductNumber, MakeFlag, FinishedGoodsFlag, Color,
        SafetyStockLevel, ReorderPoint, StandardCost, ListPrice, Size,
        SizeUnitMeasureCode, WeightUnitMeasureCode, Weight, DaysToManufacture,
        ProductLine, Class, Style, ProductSubcategoryID, ProductModelID,
        SellStartDate, SellEndDate, DiscontinuedDate, rowguid, ModifiedDate
      FROM [Production].[Product]
      ORDER BY ProductID
      OFFSET @0 ROWS FETCH NEXT @1 ROWS ONLY`,
      'SELECT COUNT_BIG(*) AS total FROM [Production].[Product]',
      query,
    );
  }

  async findProduct(id: number): Promise<DatabaseRow> {
    const rows = await this.dataSource.query<DatabaseRow[]>(
      `SELECT
        ProductID, Name, ProductNumber, MakeFlag, FinishedGoodsFlag, Color,
        SafetyStockLevel, ReorderPoint, StandardCost, ListPrice, Size,
        SizeUnitMeasureCode, WeightUnitMeasureCode, Weight, DaysToManufacture,
        ProductLine, Class, Style, ProductSubcategoryID, ProductModelID,
        SellStartDate, SellEndDate, DiscontinuedDate, rowguid, ModifiedDate
      FROM [Production].[Product]
      WHERE ProductID = @0`,
      [id],
    );

    if (!rows[0]) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return rows[0];
  }

  async findProductCategories(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<DatabaseRow>> {
    return this.findPaginated(
      `SELECT ProductCategoryID, Name, rowguid, ModifiedDate
      FROM [Production].[ProductCategory]
      ORDER BY ProductCategoryID
      OFFSET @0 ROWS FETCH NEXT @1 ROWS ONLY`,
      'SELECT COUNT_BIG(*) AS total FROM [Production].[ProductCategory]',
      query,
    );
  }

  async findProductSubcategories(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<DatabaseRow>> {
    return this.findPaginated(
      `SELECT ProductSubcategoryID, ProductCategoryID, Name, rowguid, ModifiedDate
      FROM [Production].[ProductSubcategory]
      ORDER BY ProductSubcategoryID
      OFFSET @0 ROWS FETCH NEXT @1 ROWS ONLY`,
      'SELECT COUNT_BIG(*) AS total FROM [Production].[ProductSubcategory]',
      query,
    );
  }

  private async findPaginated(
    selectSql: string,
    countSql: string,
    { page, limit }: PaginationQueryDto,
  ): Promise<PaginatedResult<DatabaseRow>> {
    const offset = (page - 1) * limit;
    const [data, countRows] = await Promise.all([
      this.dataSource.query<DatabaseRow[]>(selectSql, [offset, limit]),
      this.dataSource.query<CountRow[]>(countSql),
    ]);
    const total = Number(countRows[0]?.total ?? 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
