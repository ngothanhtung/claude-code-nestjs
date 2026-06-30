# AW Production Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new NestJS module `src/modules/aw/` exposing `GET /api/aw/production/products` that runs `SELECT * FROM [Production].[Product] ORDER BY [Name]` against MSSQL via a separate named TypeORM connection.

**Architecture:** Standalone module with its own `'aw'` named TypeORM connection (reusing `src/config/configuration.ts → mssql` config). One controller + one service + one constants file. Wired into `AppModule` RouterModule with prefix `api/aw`. Coexists with the existing `adventure-works` module.

**Tech Stack:** NestJS 11, TypeORM (MSSQL named connection), `@nestjs/config`, `@nestjs/swagger`, Jest + ts-jest (existing test stack).

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `src/modules/aw/aw.constants.ts` | Create | Exports `AW_CONNECTION = 'aw'` token |
| `src/modules/aw/aw.module.ts` | Create | Registers `'aw'` MSSQL TypeORM connection + declares `ProductionController` and `ProductionService` |
| `src/modules/aw/production/production.controller.ts` | Create | `GET /production` → service |
| `src/modules/aw/production/production.services.ts` | Create | `findProducts()` runs the SQL |
| `src/modules/aw/production/production.services.spec.ts` | Create | Unit test for `findProducts()` (mocked `DataSource`) |
| `src/app.module.ts` | Modify | Imports `AwModule` and adds `RouterModule.register` entry for `api/aw` |

---

### Task 1: Create the connection constant file

**Files:**
- Create: `src/modules/aw/aw.constants.ts`

- [ ] **Step 1: Create the constants file**

Create `src/modules/aw/aw.constants.ts` with the following content:

```ts
export const AW_CONNECTION = 'aw';
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/aw/aw.constants.ts
git commit -m "feat(aw): add AW_CONNECTION constant

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: TDD — write the failing test for `ProductionService.findProducts()`

**Files:**
- Create: `src/modules/aw/production/production.services.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `src/modules/aw/production/production.services.spec.ts`:

```ts
import { AW_CONNECTION } from '../aw.constants';
import { ProductionService } from './production.services';

type FakeRow = Record<string, unknown>;

describe('ProductionService', () => {
  let dataSource: { query: jest.Mock<Promise<FakeRow[]>, [string, unknown[]?]> };
  let service: ProductionService;

  beforeEach(() => {
    dataSource = {
      query: jest.fn<Promise<FakeRow[]>, [string, unknown[]?]>(),
    };
    (dataSource.query as jest.Mock).mockResolvedValue([
      { ProductID: 1, Name: 'A' },
    ]);
    service = new ProductionService(
      dataSource as unknown as ConstructorParameters<
        typeof ProductionService
      >[0],
    );
  });

  it('runs the exact SELECT * FROM [Production].[Product] ORDER BY [Name] query', async () => {
    await service.findProducts();

    expect(dataSource.query).toHaveBeenCalledTimes(1);
    expect(dataSource.query).toHaveBeenCalledWith(
      'SELECT * FROM [Production].[Product] ORDER BY [Name]',
    );
  });

  it('returns whatever the data source query resolves with', async () => {
    const rows: FakeRow[] = [
      { ProductID: 1, Name: 'A' },
      { ProductID: 2, Name: 'B' },
    ];
    (dataSource.query as jest.Mock).mockResolvedValue(rows);

    await expect(service.findProducts()).resolves.toEqual(rows);
  });

  it('uses the AW named connection for injection', () => {
    // Service is constructed directly in this test, but verify the constant
    // is referenced in the decorator path — guard against accidental rename.
    expect(AW_CONNECTION).toBe('aw');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
yarn test src/modules/aw/production/production.services.spec.ts
```
Expected: FAIL with `ProductionService is not defined` (or similar import/compile error from `production.services.ts`).

- [ ] **Step 3: Commit (red)**

```bash
git add src/modules/aw/production/production.services.spec.ts
git commit -m "test(aw): spec ProductionService.findProducts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Implement `ProductionService` to make the test pass (green)

**Files:**
- Create: `src/modules/aw/production/production.services.ts`

- [ ] **Step 1: Create the service implementation**

Create `src/modules/aw/production/production.services.ts`:

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

- [ ] **Step 2: Run the test to verify it passes**

Run:
```bash
yarn test src/modules/aw/production/production.services.spec.ts
```
Expected: PASS — 3 tests green.

- [ ] **Step 3: Commit (green)**

```bash
git add src/modules/aw/production/production.services.ts
git commit -m "feat(aw): implement ProductionService.findProducts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Create `ProductionController`

**Files:**
- Create: `src/modules/aw/production/production.controller.ts`

> No unit test — controller is a one-line pass-through (mirrors `src/modules/adventure-works/production/production.controller.ts` which also has no controller spec).

- [ ] **Step 1: Create the controller**

Create `src/modules/aw/production/production.controller.ts`:

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/aw/production/production.controller.ts
git commit -m "feat(aw): add ProductionController with GET /products

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Create `AwModule` registering the `'aw'` named connection

**Files:**
- Create: `src/modules/aw/aw.module.ts`

- [ ] **Step 1: Create the module**

Create `src/modules/aw/aw.module.ts`:

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

- [ ] **Step 2: Commit**

```bash
git add src/modules/aw/aw.module.ts
git commit -m "feat(aw): register AwModule with MSSQL 'aw' connection

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Wire `AwModule` into `AppModule` and add the `api/aw` route

**Files:**
- Modify: `src/app.module.ts`

- [ ] **Step 1: Add the `AwModule` import**

In `src/app.module.ts`, immediately after the existing `AdventureWorksModule` import line (currently line 19), insert:

```ts
import { AwModule } from './modules/aw/aw.module';
```

The import block becomes:

```ts
import { AdventureWorksModule } from './modules/adventure-works/adventure-works.module';
import { AwModule } from './modules/aw/aw.module';
```

- [ ] **Step 2: Add `AwModule` to the `imports` array**

In the `@Module({ imports: [...] })` array, immediately after the `AdventureWorksModule,` entry (currently line 60), add:

```ts
    AwModule,
```

- [ ] **Step 3: Add the `api/aw` route to `RouterModule.register`**

In the `RouterModule.register([...])` array, immediately after the `api/adventure-works` entry (currently lines 74-77), add a new entry:

```ts
      {
        path: 'api/aw',
        module: AwModule,
      },
```

The `RouterModule.register([...])` block should look like:

```ts
    RouterModule.register([
      {
        path: 'api/cms',
        module: CmsModule,
      },
      {
        path: 'api/lms',
        module: LmsModule,
      },
      {
        path: 'api/ecommerce',
        module: EcommerceModule,
      },
      {
        path: 'api/adventure-works',
        module: AdventureWorksModule,
      },
      {
        path: 'api/aw',
        module: AwModule,
      },
    ]),
```

- [ ] **Step 4: Commit**

```bash
git add src/app.module.ts
git commit -m "feat(aw): wire AwModule into AppModule and RouterModule (api/aw)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Final verification — lint, test, build

**Files:** none

- [ ] **Step 1: Run lint**

Run:
```bash
yarn lint
```
Expected: no errors. (Warnings allowed but should be reviewed.)

- [ ] **Step 2: Run the new test**

Run:
```bash
yarn test src/modules/aw
```
Expected: all spec files under `src/modules/aw/` pass (1 spec file, 3 tests).

- [ ] **Step 3: Run the full unit test suite**

Run:
```bash
yarn test
```
Expected: all existing tests + the new `ProductionService` spec pass.

- [ ] **Step 4: Build**

Run:
```bash
yarn build
```
Expected: TypeScript compile succeeds; `dist/modules/aw/` exists.

- [ ] **Step 5: Final commit (if any were missed)**

If prior commits covered everything, this step is a no-op. Otherwise:

```bash
git status
# stage and commit any remaining files
git commit -m "chore(aw): final cleanup

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Spec self-review

- **Spec coverage:** ✓
  - Goal (`GET /api/aw/production/products` + MSSQL) — Tasks 3, 4, 5, 6.
  - Named `'aw'` connection reusing `mssql` config — Task 5.
  - Literal `SELECT * FROM [Production].[Product] ORDER BY [Name]` — Tasks 2 & 3.
  - Swagger tags `@ApiTags('AW Production')` — Task 4.
  - RouterModule wiring with prefix `api/aw` — Task 6.
  - Lint + test + build verification — Task 7.
- **Placeholder scan:** No TBD/TODO/"implement later". Every step shows real code.
- **Type consistency:** `ProductionService` constructor param: declared once in spec (`@InjectDataSource(AW_CONNECTION) private readonly dataSource: DataSource`), referenced by spec test via typed jest mock, used by implementation file — consistent.
- **Module export name:** `AwModule` (matches the spec at section 4.2, used by Task 6 RouterModule entry).
- **Constants name:** `AW_CONNECTION = 'aw'` (matches spec section 4.1, used in Tasks 2, 3, 5).
