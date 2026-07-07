# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS 11 multi-database API with five database connections (PostgreSQL, MySQL, MSSQL, MongoDB, SQLite), Redis-backed job queues, Socket.IO real-time chat, JWT authentication, AWS SES email, file uploads, and caching. Default port: `3333`.

## Commands

```bash
yarn install          # Install dependencies
yarn build            # Compile to dist/
yarn start            # Run compiled app (dist/)
yarn start:dev        # Watch mode with hot reload
yarn start:debug      # Watch mode with debugger
yarn start:prod       # Production (node dist/main)
yarn lint             # ESLint + Prettier check/fix (note: always --fix is on)
yarn format           # Prettier format all TS files
yarn test             # Run all unit tests
yarn test path/to/file.spec.ts   # Run a specific test
yarn test:watch       # Watch mode
yarn test:debug       # Node debugger + Jest
yarn test:cov         # Coverage report
yarn test:e2e         # End-to-end tests
```

**Prerequisites**: PostgreSQL, MySQL, MSSQL, Redis, and MongoDB must be running before starting the app. Per-service docker-compose files live in `docker/`. The actual `.env` uses non-default ports — check `src/config/configuration.ts` for compiled defaults.

**Jest config**: `rootDir: src`, `testRegex: '.*\\.spec\\.ts$'`, `ts-jest` transformer.

## Architecture

### Module Hierarchy

```text
AppModule (src/app.module.ts)
├── ConfigModule         # isGlobal:true, loads src/config/configuration.ts
├── TypeOrmModule        # PostgreSQL (default — no name), autoLoadEntities + synchronize
├── TypeOrmModule 'mssql'  # MSSQL read-only (synchronize:false, migrationsRun:false)
├── TypeOrmModule 'mysql'  # MySQL (autoLoadEntities + synchronize)
├── MongooseModule       # MongoDB with custom debug logger (MongooseLogger)
├── BullModule           # Redis-backed queues (mail-queue, etc.)
├── ScheduleModule       # @nestjs/schedule cron/interval/timeout
├── CacheModule          # isGlobal:true, Redis-backed via @keyv/redis + CacheableMemory LRU
├── ThrottlerModule      # 4 tiers (default 1000/s, short 50/s, medium 500/min, long 2000/h)
├── MulterModule         # File uploads → ./public/uploads
├── ServeStaticModule    # public/ at / (excludes /api*)
├── AuthModule           # JWT + Passport
├── SocialNetworkModule  # Mongoose (MongoDB) - posts
├── EcommerceModule      # PostgreSQL - Category/Product/Order/Customer/Employee/Group/Comment/Post
├── LmsModule            # SQLite (lms.sqlite, named connection 'lms')
├── AdventureWorksModule # MSSQL read API
├── SseModule            # Server-Sent Events
├── TasksModule          # @Cron / @Interval / @Timeout
├── QueuesModule         # Mail queue (Bull → AWS SES)
└── RouterModule         # Mounts sub-modules at /api/* prefixes
```

### RouterModule Routes

|Module|Prefix|
|---|---|
|SocialNetwork|`/api/social-network`|
|Lms|`/api/lms`|
|Ecommerce|`/api/ecommerce`|
|AdventureWorks|`/api/adventure-works`|
|Scalar|`/scalar`|
|Static|`/`|

### Five Database Connections

The most important architectural detail — five separate DB connections run simultaneously:

1. **PostgreSQL** (default TypeORM, no name) — Ecommerce entities (Category, Product, Order, OrderItem, Customer, Employee, Group, Comment, Post). `autoLoadEntities:true, synchronize:true`.
2. **MySQL** (TypeORM named `'mysql'`) — `autoLoadEntities:true, synchronize:true`.
3. **MSSQL** (TypeORM named `'mssql'`) — AdventureWorks read API. `synchronize:false, migrationsRun:false, encrypt:true, trustServerCertificate:true`.
4. **MongoDB** (Mongoose) — SocialNetwork (Post schema). Uses `MongooseLogger` for debug logs every operation.
5. **SQLite** (TypeORM named `'lms'`) — `lms.sqlite` file at project root, `Student` entity.

When adding TypeORM features, specify the connection name explicitly: omit it for PostgreSQL (default), or pass `'mysql' | 'mssql' | 'lms'`.

### Ecommerce Sub-Modules

`src/modules/ecommerce/` contains: `category/`, `comment/`, `customer/`, `employee/`, `group/`, `order/`, `post/`, `product/`. Each follows the pattern `*.controller.ts` + `*.service.ts` + `*.entity.ts` (plus `dto/`).

REST conventions: `GET/POST /resource`, `GET/PUT/DELETE /resource/:id`. Product has `PATCH /products/:id/restore` for soft-delete restoration. Search uses PostgreSQL full-text (`to_tsvector` / `plainto_tsquery`).

### Auth Module

`src/modules/auth/` — JWT via `@nestjs/jwt` + `@nestjs/passport`. Has its own `guards/`, `decorators/`, `dtos/`, `entities/`, `schemas/`, `services/`, `constants/`, `interfaces/`, `controllers/`. Use `LoggedInUser` decorator (`@modules/auth/decorators/logged-in-user.decorator.ts`) to extract the current user from request.

### Common Layer (`src/common/`)

- **`base/`** — Reusable scaffolding: `BaseEntity` (id, created_time, updated_time, deleted_time, created_by, updated_by, deleted_by), `BaseController`, `BaseService`, `BaseDto`, `BaseSwagger`. Export via `@common/base`.
- **`interceptors/`** — `HttpLoggingInterceptor`, `HttpCacheInterceptor`, `HttpResponseInterceptor`.
- **`filters/`** — `HttpExceptionFilter` (global).
- **`middlewares/`** — `HttpLoggerMiddleware`.
- **`pipes/`** — `ValidationPipe` (whitelist + transform).
- **`adapters/`** — `RedisIoAdapter` (Socket.IO Redis adapter).
- **`open-api/`** — Scalar API reference setup.
- **`database-loggers/`** — `TypeormLogger`, `MongooseLogger`.

The `HttpLoggingInterceptor` and `HttpExceptionFilter` are wired globally in `AppModule.providers`. `ThrottlerGuard` is global via `APP_GUARD`.

### Path Aliases (`tsconfig.json`)

```ts
'@common/*'    → src/common/*
'@config/*'    → src/config/*
'@constants/*' → src/constants/*
'@helpers/*'   → src/helpers/*
'@modules/*'   → src/modules/*
```

Always use these aliases in imports (e.g., `import { BaseEntity } from '@common/base'`).

### Helpers (`src/helpers/`)

- `queryBuilder.ts` — Generic TypeORM query builder helper.
- `paginationToQuery.ts` — Pagination param → TypeORM query converter.
- `index.ts` — Barrel export.

### Key Patterns

**Entity conventions**: Extend `BaseEntity` from `@common/base` for soft-delete (`deleted_time` — never hard-delete), audit columns, and id. Use `@VersionColumn()` for optimistic locking.

**DTOs**: Use `@nestjs/mapped-types` for update DTOs (`UpdateXDto extends PartialType(CreateXDto)`). Validation via `class-validator` with global `ValidationPipe` (whitelist + transform).

**Serialization**: `ClassSerializerInterceptor` is global — use `@Exclude()` on entity fields to hide them from responses.

**Queue jobs**: `MailService` enqueues to `mail-queue`; `MailProcessor` handles with `@Process` / `@OnQueueActive`. Sender hardcoded as `office@softech.vn` in `MailProcessor.sendEmail()`.

**Tasks**: `TasksService` and `NotificationService` (both in `tasks.service.ts`) use `@Cron`, `@Interval`, `@Timeout` decorators.

**Events**: `src/modules/events/orders/` demonstrates `@nestjs/event-emitter` with `events/`, `listeners/`, `dto/`, `entities/`.

**EventsGateway**: Socket.IO chat gateway (broadcast `sendMessage`, server push `message`, `user-connected`, `users-list`).

**Throttling**: Global `ThrottlerGuard`. Multiple tiers configured: default (1s/1000), short (1s/50), medium (60s/500), long (3600s/2000).

## Environment Variables

See `src/config/configuration.ts`. Key vars:

|Variable|Default|Description|
|---|---|---|
|`PORT`|`3333`|Server port|
|`POSTGRES_HOST` / `POSTGRES_PORT`|`localhost` / `5432`|PostgreSQL (`.env` uses 5433)|
|`POSTGRES_USERNAME` / `POSTGRES_PASSWORD`|`postgres` / `postgres_password`|PostgreSQL|
|`POSTGRES_NAME`|`claude_code_nestjs`|PostgreSQL database|
|`MYSQL_HOST` / `MYSQL_PORT`|`localhost` / `3306`|MySQL|
|`MYSQL_USERNAME` / `MYSQL_PASSWORD`|`developer` / `developer_password`|MySQL|
|`MYSQL_DATABASE`|`claude_code_nestjs`|MySQL database|
|`MSSQL_HOST` / `MSSQL_PORT`|`localhost` / `1433`|MSSQL|
|`MSSQL_USERNAME` / `MSSQL_PASSWORD`|`developer` / `123456789`|MSSQL|
|`MSSQL_DATABASE`|`AdventureWorks`|MSSQL database|
|`REDIS_HOST` / `REDIS_PORT`|`localhost` / `6379`|Redis (`.env` uses 6380)|
|`REDIS_PASSWORD`|(none)|Optional Redis auth|
|`MONGODB_URI`|`mongodb://root:root_password@localhost:27017/cms?authSource=admin`|MongoDB|
|`CACHE_TTL` / `CACHE_MAX_SIZE`|`3600000` / `100`|Cache TTL (ms) and LRU size|
|`THROTTLE_TTL` / `THROTTLE_LIMIT`|`1` / `1000`|Default throttler (seconds / req count)|
|`AWS_SES_REGION` / `AWS_SES_ACCESS_KEY_ID` / `AWS_SES_SECRET_ACCESS_KEY`|`us-east-1` / empty / empty|Email via SES|
