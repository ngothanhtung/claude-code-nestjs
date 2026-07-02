# AdventureWorks Read API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add paginated, read-only NestJS endpoints for selected tables in the remote AdventureWorks `Production` and `Sales` schemas.

**Architecture:** Register AdventureWorks as a named TypeORM MSSQL connection owned by `AdventureWorksModule`. Inject that named `DataSource` into focused production and sales services, execute only fixed parameterized `SELECT` statements, and expose them through validated GET-only controllers.

**Tech Stack:** NestJS 11, TypeORM 0.3, Microsoft SQL Server via `mssql`, class-validator, Swagger, Jest

---

## File Structure

- Modify `package.json` and `package-lock.json`: add the SQL Server driver.
- Modify `src/config/configuration.ts`: add typed AdventureWorks MSSQL settings.
- Modify `src/modules/adventure-works/adventure-works.module.ts`: own the named connection and register both feature controllers/services.
- Create `src/modules/adventure-works/adventure-works.constants.ts`: shared connection-name token.
- Create `src/modules/adventure-works/dto/pagination-query.dto.ts`: validate page and limit.
- Create `src/modules/adventure-works/dto/positive-id-param.dto.ts`: validate positive numeric route IDs.
- Create `src/modules/adventure-works/interfaces/paginated-result.interface.ts`: stable list response contract.
- Modify `src/modules/adventure-works/production/production.services.ts`: fixed queries for three Production tables.
- Modify `src/modules/adventure-works/production/production.controller.ts`: GET-only Production API.
- Modify `src/modules/adventure-works/sales/sales.services.ts`: fixed queries for three Sales tables.
- Modify `src/modules/adventure-works/sales/sales.controller.ts`: GET-only Sales API.
- Create colocated `*.spec.ts` files for DTO, controller, and service behavior.

### Task 1: Install and configure the named MSSQL connection

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/config/configuration.ts`
- Create: `src/modules/adventure-works/adventure-works.constants.ts`
- Modify: `src/modules/adventure-works/adventure-works.module.ts`
- Test: `src/modules/adventure-works/adventure-works.module.spec.ts`

- [ ] **Step 1: Write a failing module test**

Create a Jest test that imports `AdventureWorksModule`, overrides the named
`DataSource` provider, and verifies both controllers and both services resolve.
Use `getDataSourceToken(ADVENTURE_WORKS_CONNECTION)` as the override token.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx jest src/modules/adventure-works/adventure-works.module.spec.ts --runInBand`

Expected: FAIL because the connection token and registered providers do not yet exist.

- [ ] **Step 3: Add the SQL Server driver**

Run: `npm install mssql`

Expected: `mssql` appears in dependencies and the lockfile is updated.

- [ ] **Step 4: Add typed configuration**

Extend `AppConfig` with:

```ts
mssql: {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};
```

Populate it with `MSSQL_*` variables, parsing the port with base 10. Do not add
credentials to source or log configuration values.

- [ ] **Step 5: Define and register the named connection**

Export this constant:

```ts
export const ADVENTURE_WORKS_CONNECTION = 'adventureWorks';
```

Configure `TypeOrmModule.forRootAsync` with that name and these invariants:

```ts
{
  type: 'mssql',
  synchronize: false,
  migrationsRun: false,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}
```

Register `ProductionController`, `SalesController`, `ProductionService`, and
`SalesService`. Do not use `forFeature([])` because no entity repository is
needed.

- [ ] **Step 6: Run the module test**

Run: `npx jest src/modules/adventure-works/adventure-works.module.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 7: Commit the connection layer**

```bash
git add package.json package-lock.json src/config/configuration.ts src/modules/adventure-works
git commit -m "feat: configure AdventureWorks MSSQL connection"
```

### Task 2: Add reusable request validation and pagination contract

**Files:**
- Create: `src/modules/adventure-works/dto/pagination-query.dto.ts`
- Create: `src/modules/adventure-works/dto/positive-id-param.dto.ts`
- Create: `src/modules/adventure-works/interfaces/paginated-result.interface.ts`
- Test: `src/modules/adventure-works/dto/pagination-query.dto.spec.ts`

- [ ] **Step 1: Write failing DTO tests**

Use `plainToInstance` and `validate` to cover defaults, numeric-string
conversion, `page < 1`, `limit < 1`, and `limit > 100`.

- [ ] **Step 2: Run the DTO test and verify failure**

Run: `npx jest src/modules/adventure-works/dto/pagination-query.dto.spec.ts --runInBand`

Expected: FAIL because the DTO does not exist.

- [ ] **Step 3: Implement the DTOs and result interface**

`PaginationQueryDto` must use `@Type(() => Number)`, `@IsInt()`, `@Min(1)`, and
`@Max(100)` with initialized defaults:

```ts
page = 1;
limit = 20;
```

`PositiveIdParamDto` must transform `id` to a number and require an integer of
at least 1. Define:

```ts
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

- [ ] **Step 4: Run the DTO test**

Run: `npx jest src/modules/adventure-works/dto/pagination-query.dto.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit validation primitives**

```bash
git add src/modules/adventure-works/dto src/modules/adventure-works/interfaces
git commit -m "feat: validate AdventureWorks read queries"
```

### Task 3: Implement read-only Production queries

**Files:**
- Modify: `src/modules/adventure-works/production/production.services.ts`
- Test: `src/modules/adventure-works/production/production.services.spec.ts`

- [ ] **Step 1: Write failing service tests**

Mock `DataSource.query`. Verify `findProducts({ page: 2, limit: 10 })` binds
offset `10` and limit `10`, returns `totalPages`, and uses a statement beginning
with `SELECT`. Verify `findProduct(1)` passes `[1]` and throws
`NotFoundException` for an empty result. Add equivalent happy-path assertions
for categories and subcategories.

- [ ] **Step 2: Run the service test and verify failure**

Run: `npx jest src/modules/adventure-works/production/production.services.spec.ts --runInBand`

Expected: FAIL because the service methods do not exist.

- [ ] **Step 3: Implement ProductionService**

Inject the connection explicitly:

```ts
constructor(
  @InjectDataSource(ADVENTURE_WORKS_CONNECTION)
  private readonly dataSource: DataSource,
) {}
```

Implement these methods:

```ts
findProducts(query: PaginationQueryDto): Promise<PaginatedResult<DatabaseRow>>;
findProduct(id: number): Promise<DatabaseRow>;
findProductCategories(query: PaginationQueryDto): Promise<PaginatedResult<DatabaseRow>>;
findProductSubcategories(query: PaginationQueryDto): Promise<PaginatedResult<DatabaseRow>>;
```

Use explicit columns and deterministic keys. Product queries order by
`ProductID`, categories by `ProductCategoryID`, and subcategories by
`ProductSubcategoryID`. Pagination placeholders must be `@0` and `@1`; detail
IDs use `@0`. Run a separate fixed `COUNT_BIG(*) AS total` query and convert the
driver value with `Number(...)` before calculating `Math.ceil(total / limit)`.

- [ ] **Step 4: Run the Production service tests**

Run: `npx jest src/modules/adventure-works/production/production.services.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit Production queries**

```bash
git add src/modules/adventure-works/production
git commit -m "feat: query AdventureWorks production data"
```

### Task 4: Expose the GET-only Production controller

**Files:**
- Modify: `src/modules/adventure-works/production/production.controller.ts`
- Test: `src/modules/adventure-works/production/production.controller.spec.ts`

- [ ] **Step 1: Write failing controller delegation tests**

Mock all four service methods and verify each route handler returns its service
result. Also inspect controller metadata or source exports so only GET handlers
exist; do not add Post, Put, Patch, or Delete imports.

- [ ] **Step 2: Run the controller test and verify failure**

Run: `npx jest src/modules/adventure-works/production/production.controller.spec.ts --runInBand`

Expected: FAIL because the controller is empty.

- [ ] **Step 3: Implement ProductionController**

Use `@Controller('production')` and add handlers for:

```ts
@Get('products')
@Get('products/:id')
@Get('product-categories')
@Get('product-subcategories')
```

Bind `@Query() query: PaginationQueryDto` and `@Param() params:
PositiveIdParamDto`. Add `@ApiTags`, `@ApiOperation`, `@ApiOkResponse`, and
`@ApiNotFoundResponse` where appropriate.

- [ ] **Step 4: Run the Production controller tests**

Run: `npx jest src/modules/adventure-works/production/production.controller.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit the Production API**

```bash
git add src/modules/adventure-works/production
git commit -m "feat: expose read-only production endpoints"
```

### Task 5: Implement read-only Sales queries

**Files:**
- Modify: `src/modules/adventure-works/sales/sales.services.ts`
- Test: `src/modules/adventure-works/sales/sales.services.spec.ts`

- [ ] **Step 1: Write failing service tests**

Mock `DataSource.query`. Cover paginated orders, order detail lookup, paginated
order lines filtered by `SalesOrderID`, paginated customers, customer detail,
parameter arrays, total conversion, and 404 behavior for missing order/customer.

- [ ] **Step 2: Run the service test and verify failure**

Run: `npx jest src/modules/adventure-works/sales/sales.services.spec.ts --runInBand`

Expected: FAIL because the service methods do not exist.

- [ ] **Step 3: Implement SalesService**

Inject the same named `DataSource` and implement:

```ts
findOrders(query: PaginationQueryDto): Promise<PaginatedResult<DatabaseRow>>;
findOrder(id: number): Promise<DatabaseRow>;
findOrderDetails(id: number, query: PaginationQueryDto): Promise<PaginatedResult<DatabaseRow>>;
findCustomers(query: PaginationQueryDto): Promise<PaginatedResult<DatabaseRow>>;
findCustomer(id: number): Promise<DatabaseRow>;
```

Use fixed explicit-column statements. Order headers sort by `SalesOrderID`,
order details by `SalesOrderDetailID`, and customers by `CustomerID`. For order
details, bind `[salesOrderId, offset, limit]` and use placeholders `@0`, `@1`,
and `@2`; bind `[salesOrderId]` to the count query.

- [ ] **Step 4: Run the Sales service tests**

Run: `npx jest src/modules/adventure-works/sales/sales.services.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit Sales queries**

```bash
git add src/modules/adventure-works/sales
git commit -m "feat: query AdventureWorks sales data"
```

### Task 6: Expose the GET-only Sales controller

**Files:**
- Modify: `src/modules/adventure-works/sales/sales.controller.ts`
- Test: `src/modules/adventure-works/sales/sales.controller.spec.ts`

- [ ] **Step 1: Write failing controller delegation tests**

Mock all five service methods. Verify route handlers forward IDs and pagination
DTOs exactly and return the mocked values.

- [ ] **Step 2: Run the controller test and verify failure**

Run: `npx jest src/modules/adventure-works/sales/sales.controller.spec.ts --runInBand`

Expected: FAIL because the controller is empty.

- [ ] **Step 3: Implement SalesController**

Use `@Controller('sales')` and add only:

```ts
@Get('orders')
@Get('orders/:id')
@Get('orders/:id/details')
@Get('customers')
@Get('customers/:id')
```

Declare the static `orders/:id/details` route before `orders/:id`. Bind DTOs and
add Swagger operation/response metadata.

- [ ] **Step 4: Run the Sales controller tests**

Run: `npx jest src/modules/adventure-works/sales/sales.controller.spec.ts --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit the Sales API**

```bash
git add src/modules/adventure-works/sales
git commit -m "feat: expose read-only sales endpoints"
```

### Task 7: Verify build, tests, and read-only guarantees

**Files:**
- Modify only files found defective by verification.

- [ ] **Step 1: Run focused AdventureWorks tests**

Run: `npx jest src/modules/adventure-works --runInBand`

Expected: all AdventureWorks suites PASS.

- [ ] **Step 2: Run the project build**

Run: `npm run build`

Expected: Nest compilation exits successfully.

- [ ] **Step 3: Run lint without applying broad unrelated rewrites**

Run: `npx eslint src/modules/adventure-works src/config/configuration.ts`

Expected: no lint errors in touched files.

- [ ] **Step 4: Audit read-only behavior**

Run:

```bash
rg -n "@(Post|Put|Patch|Delete)|INSERT|UPDATE|DELETE|MERGE|\.save\(|\.remove\(" src/modules/adventure-works
```

Expected: no matches outside tests that explicitly assert forbidden behavior.

- [ ] **Step 5: Inspect final diff and commit verification fixes**

Run `git diff --check` and `git status --short`. Preserve the user's unrelated
Docker and application changes. If verification required fixes, stage only the
AdventureWorks/config/dependency files and commit them with:

```bash
git commit -m "test: verify AdventureWorks read API"
```
