# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.



## Project Overview

NestJS 11 API with **3 databases**: PostgreSQL (ecommerce), SQLite (LMS), MongoDB (CMS). Redis-backed job queues, Socket.IO real-time chat, and AWS SES email. API docs via Swagger/Scalar UI. Default port: `3333`.

## Commands

```bash
yarn install          # Install dependencies
yarn build            # Compile to dist/
yarn start            # Run compiled app (dist/)
yarn start:dev        # Watch mode with hot reload
yarn start:debug      # Debug + watch mode
yarn start:prod       # Production (node dist/main)
yarn lint             # ESLint + Prettier check/fix (auto-fix)
yarn format           # Prettier format all TS files
yarn test             # Run all unit tests
yarn test src/foo/bar.spec.ts   # Run a specific test file
yarn test:watch       # Watch mode
yarn test:cov         # Coverage report
yarn test:e2e         # End-to-end tests
```

**Environment variables** (see `src/config/configuration.ts` for defaults):

| Variable                    | Default                                             | Description                  |
| --------------------------- | --------------------------------------------------- | ---------------------------- |
| `PORT`                      | `3333`                                              | Server port                  |
| `CORS_ORIGIN`               | `*`                                                 | CORS allowed origin          |
| `DB_HOST`                   | `localhost`                                         | PostgreSQL host              |
| `DB_PORT`                   | `5432`                                              | PostgreSQL port              |
| `DB_USERNAME`               | `postgres`                                          | PostgreSQL user              |
| `DB_PASSWORD`               | `postgres_password`                                 | PostgreSQL password          |
| `DB_NAME`                   | `claude_code_nestjs`                                | PostgreSQL database name     |
| `MONGODB_URI`               | `mongodb://.../cms?authSource=admin`                | MongoDB connection string    |
| `REDIS_HOST`                | `localhost`                                         | Redis host                   |
| `REDIS_PORT`                | `6379`                                              | Redis port                   |
| `REDIS_PASSWORD`            | _(none)_                                            | Redis password               |
| `AWS_SES_REGION`            | `us-east-1`                                         | AWS SES region               |
| `AWS_SES_ACCESS_KEY_ID`     | _(empty)_                                           | AWS credentials              |
| `AWS_SES_SECRET_ACCESS_KEY` | _(empty)_                                           | AWS credentials              |

**Prerequisites**: PostgreSQL, MongoDB, and Redis must be running before starting the app.

## Architecture

### Module Hierarchy

```text
AppModule (src/app.module.ts)
├── ConfigModule            # Environment variables via src/config/configuration.ts
├── TypeOrmModule           # PostgreSQL (ecommerce), autoLoadEntities, synchronize:true
├── BullModule              # Redis-backed job queues
├── ScheduleModule          # @nestjs/schedule cron/interval/timeout
├── ServeStaticModule       # Serves public/ directory at /
├── RouterModule            # Prefix routing for sub-modules
│
├── CmsModule               # Mounted at /api/cms via RouterModule
│   └── MongooseModule      # MongoDB connection
│
├── LmsModule               # Mounted at /api/lms via RouterModule
│   └── TypeOrmModule       # SQLite (separate connection named 'lms')
│       └── StudentsService / StudentsController
│
└── EcommerceModule         # Mounted at /api/ecommerce via RouterModule
    ├── CategoryService / CategoryController
    ├── ProductService / ProductController
    ├── OrderService / OrderController
    ├── MailService / MailProcessor   # Bull queue → AWS SES
    ├── EventsGateway                # Socket.IO real-time chat
    └── TasksService / NotificationService  # @Cron / @Interval / @Timeout
```

### API Routes

**Ecommerce** (prefix `/api/ecommerce`):

- `GET/POST` `/api/ecommerce/categories`
- `GET/PUT/DELETE` `/api/ecommerce/categories/:id`
- `GET/POST` `/api/ecommerce/products`
- `GET/PUT/DELETE` `/api/ecommerce/products/:id`
- `PATCH` `/api/ecommerce/products/:id/restore` — soft-restore deleted product
- `GET/POST` `/api/ecommerce/orders`
- `GET` `/api/ecommerce/orders/:id`
- `PATCH` `/api/ecommerce/orders/:id/status` — update order status

**LMS** (prefix `/api/lms`):

- `GET/POST` `/api/lms/students`
- `GET/PUT/DELETE` `/api/lms/students/:id`

**CMS** (prefix `/api/cms`):

- _(MongoDB-connected module, routes to be defined)_

**API Documentation**:

- `/scalar` — Scalar UI (OpenAPI playground)
- `/open-api-json` — Raw OpenAPI JSON spec

### Socket.IO Events

- `connection/disconnect` — user join/leave; broadcasts `user-connected` / `user-disconnected`
- `sendMessage` — client sends `{ user, text }`; server broadcasts `message` event to all clients
- `message` — server pushes messages to all connected clients
- `users-list` — sent to new connection with all active user IDs

### Key Patterns

**Entity conventions**:

- **PostgreSQL (ecommerce)**: UUID primary keys, soft-delete via `deletedAt` column (Product only), `@VersionColumn()` for optimistic locking (Order). Category and Order use hard delete.
- **SQLite (LMS)**: UUID primary keys, no soft-delete (hard delete only).
- **MongoDB (CMS)**: Managed via Mongoose schemas.

**Search**: Product search uses PostgreSQL full-text search (`to_tsvector` / `plainto_tsquery`).

**Transactions**: Order creation uses `DataSource.transaction()` with atomic stock decrement via `manager.decrement`.

**DTOs**: Use `@nestjs/mapped-types` for `Update*Dto` (extends `PartialType`). Validation via `class-validator` with global `ValidationPipe` (whitelist + forbidNonWhitelisted + transform + enableImplicitConversion). Input sanitization via `@Transform` (trim).

**Serialization**: `ClassSerializerInterceptor` is global — use `@Exclude()` on entity fields to hide them from responses.

**Database connections**:
- Ecommerce: PostgreSQL via TypeORM (default connection)
- LMS: SQLite via TypeORM (named connection `'lms'`, file `lms.sqlite`)
- CMS: MongoDB via Mongoose (`MongooseModule.forRootAsync`)

**Queue jobs**: `MailService` enqueues jobs to `mail-queue`; `MailProcessor` (annotated `@Processor('mail-queue')`) handles them with `@Process('send')`, `@OnQueueActive`, etc.

**Mail sender**: Hardcoded as `office@softech.vn` in `MailProcessor.sendEmail()` — update when configuring domain verification in AWS SES.

**Tasks**: `TasksService` and `NotificationService` share the same file (`tasks.service.ts`). Both use `@Cron(CronExpression.EVERY_30_SECONDS)`, `@Interval`, `@Timeout` with timezone override for notifications (`Asia/Ho_Chi_Minh`).

**Testing**: Currently minimal — one `app.controller.spec.ts` unit test and one `test/app.e2e-spec.ts` e2e test. No module-specific tests yet.
