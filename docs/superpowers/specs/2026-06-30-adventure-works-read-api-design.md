# AdventureWorks Read API Design

## Goal

Expose read-only NestJS endpoints for selected tables in the `Production` and
`Sales` schemas of the remote Microsoft SQL Server AdventureWorks database.
The API must never create, update, or delete AdventureWorks data.

## Scope

The first version covers these tables:

- `Production.Product`
- `Production.ProductCategory`
- `Production.ProductSubcategory`
- `Sales.SalesOrderHeader`
- `Sales.SalesOrderDetail`
- `Sales.Customer`

Only HTTP `GET` routes are included. Arbitrary SQL, arbitrary table names, and
write operations are outside the scope.

## Architecture

`AdventureWorksModule` owns a named TypeORM connection called
`adventureWorks`. It reads the `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USERNAME`,
`MSSQL_PASSWORD`, and `MSSQL_DATABASE` environment variables through Nest's
typed configuration. This connection uses the SQL Server driver, disables
schema synchronization, and does not register entities because AdventureWorks
is an existing read-only data source.

`ProductionController` delegates production queries to `ProductionService`.
`SalesController` delegates sales queries to `SalesService`. Each service uses
constructor injection to receive the named AdventureWorks `DataSource` and
executes fixed, parameterized SQL statements. Controllers contain no database
logic.

The module remains mounted below `/api/adventure-works` through the existing
`RouterModule` registration.

## API

### Production

- `GET /api/adventure-works/production/products`
- `GET /api/adventure-works/production/products/:id`
- `GET /api/adventure-works/production/product-categories`
- `GET /api/adventure-works/production/product-subcategories`

### Sales

- `GET /api/adventure-works/sales/orders`
- `GET /api/adventure-works/sales/orders/:id`
- `GET /api/adventure-works/sales/orders/:id/details`
- `GET /api/adventure-works/sales/customers`
- `GET /api/adventure-works/sales/customers/:id`

List endpoints accept `page` and `limit`. Defaults are `page=1` and `limit=20`,
with `limit` capped at 100. Responses use this shape:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Detail endpoints return one record. The order-details endpoint returns the
detail rows belonging to the specified sales order and uses the same paginated
response shape.

## Query and Data Rules

- SQL statements contain fixed schema and table names.
- Request values are passed as query parameters, never concatenated into SQL.
- Pagination uses deterministic ordering and SQL Server `OFFSET ... FETCH`.
- List queries select useful public columns explicitly instead of `SELECT *`.
- No endpoint or service method executes `INSERT`, `UPDATE`, `DELETE`, `MERGE`,
  stored procedures, or user-supplied SQL.
- TypeORM `synchronize` and migrations are disabled for this connection.

## Validation and Errors

A shared pagination DTO validates and transforms query parameters using the
project's global validation pipe. Route IDs must be positive integers.

- Missing detail records return HTTP 404.
- Invalid parameters return HTTP 400.
- Unexpected database failures are logged without credentials or raw secrets
  and returned through Nest's standard server-error handling.

## Security

Database credentials remain in environment variables and are not returned or
logged. The application account should have `SELECT` permission only on the
required AdventureWorks objects. Transport encryption and certificate options
are configured explicitly for the remote SQL Server connection.

The API does not accept a schema name, table name, column name, sort expression,
or raw SQL from clients. This removes the dynamic identifier injection surface.

## Documentation and Tests

Swagger decorators describe routes, path parameters, pagination parameters,
and common responses.

Unit tests mock the named `DataSource` and verify:

- controllers delegate to the correct service methods;
- pagination offsets and limits are calculated correctly;
- IDs and other values are bound as parameters;
- missing detail records produce 404 responses;
- no write method is exposed.

The project build and focused test suite must pass before completion.

## Dependencies and Configuration

Install the TypeORM SQL Server driver package `mssql`. Extend `AppConfig` with a
typed `mssql` section populated from the existing `MSSQL_*` environment
variables. Existing PostgreSQL, LMS, Redis, MongoDB, and ecommerce configuration
must remain unchanged.
