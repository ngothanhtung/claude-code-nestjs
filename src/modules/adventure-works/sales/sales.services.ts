import { DataSource } from 'typeorm';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { PaginationQueryDto } from '../dto/pagination-query.dto';
import {
  DatabaseRow,
  PaginatedResult,
} from '../interfaces/paginated-result.interface';

interface CountRow {
  total: number | string;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectDataSource('mssql')
    private readonly dataSource: DataSource,
  ) {}

  findOrders(query: PaginationQueryDto): Promise<PaginatedResult<DatabaseRow>> {
    return this.findPaginated(
      `SELECT
        SalesOrderID, RevisionNumber, OrderDate, DueDate, ShipDate, Status,
        OnlineOrderFlag, SalesOrderNumber, PurchaseOrderNumber, AccountNumber,
        CustomerID, SalesPersonID, TerritoryID, BillToAddressID,
        ShipToAddressID, ShipMethodID, CreditCardID, CreditCardApprovalCode,
        CurrencyRateID, SubTotal, TaxAmt, Freight, TotalDue, Comment, rowguid,
        ModifiedDate
      FROM [Sales].[SalesOrderHeader]
      ORDER BY SalesOrderID
      OFFSET @0 ROWS FETCH NEXT @1 ROWS ONLY`,
      'SELECT COUNT_BIG(*) AS total FROM [Sales].[SalesOrderHeader]',
      query,
    );
  }

  async findOrder(id: number): Promise<DatabaseRow> {
    const rows = await this.dataSource.query<DatabaseRow[]>(
      `SELECT
        SalesOrderID, RevisionNumber, OrderDate, DueDate, ShipDate, Status,
        OnlineOrderFlag, SalesOrderNumber, PurchaseOrderNumber, AccountNumber,
        CustomerID, SalesPersonID, TerritoryID, BillToAddressID,
        ShipToAddressID, ShipMethodID, CreditCardID, CreditCardApprovalCode,
        CurrencyRateID, SubTotal, TaxAmt, Freight, TotalDue, Comment, rowguid,
        ModifiedDate
      FROM [Sales].[SalesOrderHeader]
      WHERE SalesOrderID = @0`,
      [id],
    );

    if (!rows[0]) {
      throw new NotFoundException(`Sales order with ID "${id}" not found`);
    }

    return rows[0];
  }

  async findOrderDetails(
    id: number,
    { page, limit }: PaginationQueryDto,
  ): Promise<PaginatedResult<DatabaseRow>> {
    await this.findOrder(id);
    const offset = (page - 1) * limit;
    const [data, countRows] = await Promise.all([
      this.dataSource.query<DatabaseRow[]>(
        `SELECT
          SalesOrderID, SalesOrderDetailID, CarrierTrackingNumber,
          OrderQty, ProductID, SpecialOfferID, UnitPrice, UnitPriceDiscount,
          LineTotal, rowguid, ModifiedDate
        FROM [Sales].[SalesOrderDetail]
        WHERE SalesOrderID = @0
        ORDER BY SalesOrderDetailID
        OFFSET @1 ROWS FETCH NEXT @2 ROWS ONLY`,
        [id, offset, limit],
      ),
      this.dataSource.query<CountRow[]>(
        `SELECT COUNT_BIG(*) AS total
        FROM [Sales].[SalesOrderDetail]
        WHERE SalesOrderID = @0`,
        [id],
      ),
    ]);

    return this.toPaginatedResult(data, countRows, page, limit);
  }

  findCustomers(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<DatabaseRow>> {
    return this.findPaginated(
      `SELECT CustomerID, PersonID, StoreID, TerritoryID, AccountNumber,
        rowguid, ModifiedDate
      FROM [Sales].[Customer]
      ORDER BY CustomerID
      OFFSET @0 ROWS FETCH NEXT @1 ROWS ONLY`,
      'SELECT COUNT_BIG(*) AS total FROM [Sales].[Customer]',
      query,
    );
  }

  async findCustomer(id: number): Promise<DatabaseRow> {
    const rows = await this.dataSource.query<DatabaseRow[]>(
      `SELECT CustomerID, PersonID, StoreID, TerritoryID, AccountNumber,
        rowguid, ModifiedDate
      FROM [Sales].[Customer]
      WHERE CustomerID = @0`,
      [id],
    );

    if (!rows[0]) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }

    return rows[0];
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

    return this.toPaginatedResult(data, countRows, page, limit);
  }

  private toPaginatedResult(
    data: DatabaseRow[],
    countRows: CountRow[],
    page: number,
    limit: number,
  ): PaginatedResult<DatabaseRow> {
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
