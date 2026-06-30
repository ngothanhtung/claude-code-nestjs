# AW Production Module — Design

**Date:** 2026-06-30
**Status:** Approved
**Owner:** tony

## 1. Goal

Add a new NestJS module `aw` (AdventureWorks) that exposes one MSSQL-backed read endpoint:

> `GET http://localhost:3333/api/aw/production/products` (resolved: `@Controller('production')` + `@Get('products')`)

returning rows from `[Production].[Product]` ordered by `Name`. The module is intentionally separate from the existing `adventure-works` module — both connect to the same MSSQL database (`AdventureWorks`) but use independent TypeORM named connections.

## 2. Context

The repository (`claude-code-nestjs`) already has a `src/modules/adventure-works/` module wired to MSSQL via the named connection `'AdventureWorks'` and registered under `api/adventure-works`. The new module is a **parallel, simplified** implementation — same DB, different connection, different route prefix.

### Why a separate module

- The user explicitly requested a new `modules/aw` with prefix `api/aw`.
- Keeping `adventure-works` intact preserves the richer functionality (pagination, additional tables) it already has.
- Two TypeORM connections to the same DB are valid and give independent connection pools.

## 3. Architecture

```text
src/modules/aw/
├── aw.constants.ts                       # AW_CONNECTION = 'aw'
├── aw.module.ts                          # TypeOrmModule.forRootAsync('aw') + registers controllers/providers
└── production/
    ├── production.controller.ts          # GET /api/aw/production/products
    └── production.services.ts            # findProducts(): runs SELECT * FROM [Production].[Product] ORDER BY [Name]

src/app.module.ts                        # +imports: AwModule  +RouterModule.register: api/aw → AwModule
```

### Connection

A second MSSQL TypeORM connection under the name `aw`, populated from the existing `mssql` config block in `src/config/configuration.ts` (env vars `MSSQL_HOST` / `MSSQL_PORT` / `MSSQL_USERNAME` / `MSSQL_PASSWORD` / `MSSQL_DATABASE`, default DB `AdventureWorks`).

```ts
TypeOrmModule.forRootAsync({
  name: AW_CONNECTION,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config) => {
    const db = config.get('mssql', { infer: true });
    return {
      type: 'mssql',
      host: db.host,
      port: db.port,
      username: db.username,
      password: db.password,
      database: db.database,
      synchronize: false,
      migrationsRun: false,
      options: { encrypt: true, trustServerCertificate: true },
    };
  },
})
```

Settings mirror `adventure-works/adventure-works.module.ts:14-36` for consistency.

## 4. Components

### 4.1 `aw.constants.ts`

```ts
export const AW_CONNECTION = 'aw';
```

### 4.2 `aw.module.ts`

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../../config/configuration';
import { AW_CONNECTION } from './aw.constants';
import { ProductionController } from './production/production.controller';
import { ProductionService } from './production/production.services';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      name: AW_CONNECTION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('mssql', { infer: true });
        return {
          type: 'mssql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          synchronize: false,
          migrationsRun: false,
          options: { encrypt: true, trustServerCertificate: true },
        };
      },
    }),
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class AwModule {}
```

### 4.3 `production.controller.ts`

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductionService } from './production.services';

@ApiTags('AW Production')
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Get('products')
  @ApiOperation({ summary: 'List all products from [Production].[Product] ordered by Name' })
  @ApiOkResponse({ description: 'All production products ordered by Name' })
  findProducts() {
    return this.productionService.findProducts();
  }
}
```

After `RouterModule` applies the `api/aw` prefix, the route becomes `GET /api/aw/production/products`.

### 4.4 `production.services.ts`

```ts
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AW_CONNECTION } from '../aw.constants';

type ProductRow = Record<string, unknown>;

@Injectable()
export class ProductionService {
  constructor(
    @InjectDataSource(AW_CONNECTION)
    private readonly dataSource: DataSource,
  ) {}

  async findProducts(): Promise<ProductRow[]> {
    return this.dataSource.query<ProductRow[]>(
      'SELECT * FROM [Production].[Product] ORDER BY [Name]',
    );
  }
}
```

The query is the literal user request: `SELECT * FROM [Production].[Product] ORDER BY [Name]`. Return type is left as `Record<string, unknown>` because MSSQL row shape is not modelled with a TypeORM entity (no entities directory exists in this module).

## 5. Routing wiring (src/app.module.ts)

Add to the module's `imports` and to `RouterModule.register([...])`:

```ts
import { AwModule } from './modules/aw/aw.module';

// in imports:
//   AwModule,

// in RouterModule.register:
//   { path: 'api/aw', module: AwModule },
```

No changes to existing `api/adventure-works`, `api/cms`, `api/lms`, or `api/ecommerce` routes.

## 6. SQL

```sql
SELECT * FROM [Production].[Product] ORDER BY [Name]
```

This is taken verbatim from the user's request. The query runs against the configured MSSQL database (`AdventureWorks` by default).

## 7. Tests

- `src/modules/aw/production/production.services.spec.ts`: mocks `DataSource`, verifies `findProducts()` calls `dataSource.query` with the literal SQL `'SELECT * FROM [Production].[Product] ORDER BY [Name]'` and returns whatever the mocked query yields.
- No controller spec — the controller is a 1-line pass-through and the existing pattern (`adventure-works`) does not include a controller spec.

## 8. Verification checklist

1. `yarn lint` passes.
2. `yarn test src/modules/aw/production/production.services.spec.ts` passes.
3. `yarn build` succeeds.
4. With MSSQL reachable (per `.env` values), `curl http://localhost:3333/api/aw/production/products` returns an array of product rows (non-empty if `AdventureWorks` sample data is present).

## 9. Out of scope

- Pagination (no `PaginationQueryDto` in this module — endpoint returns all rows).
- Additional tables (`ProductCategory`, `ProductSubcategory`, etc.) — those live in `adventure-works`.
- TypeORM entities / migrations — module relies on raw queries against an externally-managed schema.
- Reusing DTOs from `adventure-works` — keeping modules isolated to avoid coupling.

## 10. Risks

- **Two connections to one DB**: Acceptable. Two pools, same target. No cross-connection transactions.
- **`SELECT *` in production code**: Matches user request. If `Production.Product` schema changes, response shape will change silently. Documented in code via the comment-less SQL; future enhancement is to switch to explicit column listing like `adventure-works`.
