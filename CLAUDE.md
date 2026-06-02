# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS 11 e-commerce API with PostgreSQL, Redis-backed job queues, Socket.IO real-time chat, and AWS SES email. Default port: `3333`.

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

**Environment variables** (see `src/config/configuration.ts` for defaults):

| Variable                    | Default              | Description              |
| --------------------------- | -------------------- | ------------------------ |
| `PORT`                      | `3333`               | Server port              |
| `CORS_ORIGIN`               | `*`                  | CORS allowed origin      |
| `DB_HOST`                   | `localhost`          | PostgreSQL host          |
| `DB_PORT`                   | `5432`               | PostgreSQL port          |
| `DB_USERNAME`               | `postgres`           | PostgreSQL user          |
| `DB_PASSWORD`               | `postgres_password`  | PostgreSQL password      |
| `DB_NAME`                   | `claude_code_nestjs` | PostgreSQL database name |
| `REDIS_HOST`                | `localhost`          | Redis host               |
| `REDIS_PORT`                | `6379`               | Redis port               |
| `REDIS_PASSWORD`            | _(none)_             | Redis password           |
| `AWS_SES_REGION`            | `us-east-1`          | AWS SES region           |
| `AWS_SES_ACCESS_KEY_ID`     | _(empty)_            | AWS credentials          |
| `AWS_SES_SECRET_ACCESS_KEY` | _(empty)_            | AWS credentials          |

**Prerequisites**: PostgreSQL and Redis must be running before starting the app.

## Architecture

### Module Hierarchy

```
AppModule (src/app.module.ts)
├── ConfigModule          # Environment variables via src/config/configuration.ts
├── TypeOrmModule         # PostgreSQL, autoLoadEntities, synchronize:true
├── BullModule            # Redis-backed job queues
├── ScheduleModule        # @nestjs/schedule cron/interval/timeout
├── ServeStaticModule     # Serves public/ directory at /
└── EcommerceModule       # Mounted at /api/ecommerce via RouterModule
    ├── CategoryService / CategoryController
    ├── ProductService / ProductController
    ├── OrderService / OrderController
    ├── MailService / MailProcessor   # Bull queue → AWS SES
    ├── EventsGateway                # Socket.IO real-time chat
    └── TasksService / NotificationService  # @Cron / @Interval / @Timeout
```

### API Routes

All ecommerce routes are prefixed with `/api/ecommerce`:

- `GET/POST` `/api/ecommerce/categories`
- `GET/PUT/DELETE` `/api/ecommerce/categories/:id`
- `GET/POST` `/api/ecommerce/products`
- `GET/PUT/DELETE` `/api/ecommerce/products/:id`
- `PATCH` `/api/ecommerce/products/:id/restore`
- `GET/POST` `/api/ecommerce/orders`
- `GET/PUT/DELETE` `/api/ecommerce/orders/:id`

Socket.IO events (port same as HTTP):

- `connection/disconnect` — user join/leave
- `sendMessage` — broadcast message
- `message` — server pushes to all clients

### Key Patterns

**Entity conventions**: Use `deletedAt` soft-delete (never hard-delete), `@VersionColumn()` for optimistic locking. Product search uses PostgreSQL full-text search (`to_tsvector` / `plainto_tsquery`).

**DTOs**: Use `@nestjs/mapped-types` for `UpdateCategoryDto`, `UpdateProductDto`, etc. Validation via `class-validator` with global `ValidationPipe` (whitelist + transform).

**Serialization**: `ClassSerializerInterceptor` is global — use `@Exclude()` on entity fields to hide them from responses.

**Queue jobs**: `MailService` enqueues jobs to `mail-queue`; `MailProcessor` (annotated `@Processor`) handles them with `@Process`, `@OnQueueActive`, etc.

**Mail sender**: Hardcoded as `office@softech.vn` in `MailProcessor.sendEmail()` — update when configuring domain verification in AWS SES.

**Tasks**: `TasksService` and `NotificationService` share the same file. Both use `@Cron(CronExpression.EVERY_30_SECONDS)` with a timezone override for `notifications`.
