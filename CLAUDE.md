# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS 11 e-commerce API with **three database connections** (PostgreSQL, MongoDB, SQLite), Redis-backed job queues, Socket.IO real-time chat, and AWS SES email. Default port: `3333`.

## Commands

```bash
yarn install          # Install dependencies
yarn build            # Compile to dist/
yarn start            # Run compiled app (dist/)
yarn start:dev        # Watch mode with hot reload
yarn start:prod       # Production (node dist/main)
yarn lint             # ESLint + Prettier check/fix
yarn lint --fix       # Auto-fix lint issues
yarn format           # Prettier format all TS files
yarn test             # Run all unit tests
yarn test src/foo/bar.service.spec.ts   # Run a specific test
yarn test --watch     # Watch mode
yarn test:cov         # Coverage report
yarn test:e2e         # End-to-end tests
```

**Prerequisites**: PostgreSQL, Redis, and MongoDB must be running before starting the app. Per-service docker-compose files are in `docker/` (e.g., `docker/postgresql/docker-compose.yml` runs on host port 5433, `docker/redis/` on 6380, `docker/mongodb/` on 27018). Note: the actual `.env` uses these non-default ports — check `src/config/configuration.ts` for compiled defaults.

## Architecture

### Module Hierarchy

```text
AppModule (src/app.module.ts)
├── ConfigModule          # Environment variables via src/config/configuration.ts
├── TypeOrmModule         # PostgreSQL (global connection, autoLoadEntities, synchronize:true)
├── BullModule            # Redis-backed job queues
├── ScheduleModule        # @nestjs/schedule cron/interval/timeout
├── ServeStaticModule     # Serves public/ directory at /
└── RouterModule
    ├── /api/cms   → CmsModule         # MongoDB via Mongoose (separate DB)
    ├── /api/lms   → LmsModule         # SQLite via named TypeORM connection 'lms'
    └── /api/ecommerce → EcommerceModule  # PostgreSQL (default TypeORM connection)
        ├── Category / Product / Order / Customer / Employee  # CRUD modules
        ├── MailService / MailProcessor   # Bull queue → AWS SES
        ├── EventsGateway                # Socket.IO real-time chat
        └── TasksService                 # @Cron / @Interval / @Timeout
```

### Three Database Connections

This is the most important architectural detail — the app manages **three separate DB connections simultaneously**:

1. **PostgreSQL** (default TypeORM connection) — Ecommerce entities (Category, Product, Order, OrderItem, Customer, Employee). `synchronize: true` auto-syncs schema.
2. **MongoDB** (via `MongooseModule.forRootAsync`) — CmsModule. Connection configured separately; currently has no entities/collections defined.
3. **SQLite** (TypeORM named connection `'lms'`) — LmsModule with `Student` entity. Uses `lms.sqlite` file at project root. This is a **separate** TypeORM instance, not the global PostgreSQL one.

When adding TypeORM features, know which connection you're targeting: omit `@InjectRepository()` connection name for PostgreSQL (default), or pass `'lms'` for the SQLite connection.

### API Routes

All routes are prefixed by `RouterModule`:

|Module|Prefix|Description|
|---|---|---|
|Ecommerce|`/api/ecommerce`|Categories, Products, Orders, Customers, Employees|
|CMS|`/api/cms`|MongoDB-backed (minimal)|
|LMS|`/api/lms`|SQLite-backed Student CRUD|
|Scalar|`/scalar`|API reference docs (Scalar UI, not Swagger)|
|Static|`/`|Serves `public/chat.html` (Socket.IO test client)|

Ecommerce CRUD routes follow REST conventions: `GET/POST /resource`, `GET/PUT/DELETE /resource/:id`, with `PATCH /products/:id/restore` for soft-delete restoration.

Socket.IO events: `connection`, `disconnect`, `sendMessage` (broadcast), `message` (server push), `user-connected`, `users-list`.

### Key Patterns

**Entity conventions**: Use `deletedAt` soft-delete (never hard-delete), `@VersionColumn()` for optimistic locking. Product search uses PostgreSQL full-text search (`to_tsvector` / `plainto_tsquery`).

**DTOs**: Use `@nestjs/mapped-types` for update DTOs (e.g., `UpdateCategoryDto extends PartialType(CreateCategoryDto)`). Validation via `class-validator` with global `ValidationPipe` (whitelist + transform).

**Serialization**: `ClassSerializerInterceptor` is global — use `@Exclude()` on entity fields to hide them from responses.

**Queue jobs**: `MailService` enqueues jobs to `mail-queue`; `MailProcessor` (annotated `@Processor`) handles them with `@Process`, `@OnQueueActive`, etc.

**Mail sender**: Hardcoded as `office@softech.vn` in `MailProcessor.sendEmail()` — update when configuring domain verification in AWS SES.

**Tasks**: `TasksService` and `NotificationService` share the same file. Both use `@Cron(CronExpression.EVERY_30_SECONDS)` with a timezone override for `notifications`.

## Environment Variables

See `src/config/configuration.ts` for defaults. Key variables:

|Variable|Default|Description|
|---|---|---|
|`PORT`|`3333`|Server port|
|`DB_HOST` / `DB_PORT`|`localhost` / `5432`|PostgreSQL (`.env` uses 5433)|
|`DB_USERNAME` / `DB_PASSWORD`|`postgres` / `postgres_password`|PostgreSQL credentials|
|`DB_NAME`|`claude_code_nestjs`|PostgreSQL database|
|`REDIS_HOST` / `REDIS_PORT`|`localhost` / `6379`|Redis (`.env` uses 6380)|
|`AWS_SES_REGION` / `AWS_SES_ACCESS_KEY_ID` / `AWS_SES_SECRET_ACCESS_KEY`|`us-east-1` / empty|Email via SES|
