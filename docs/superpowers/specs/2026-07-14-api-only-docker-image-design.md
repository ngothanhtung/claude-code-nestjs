# API-Only Docker Image Design

## Goal

Replace the all-in-one runtime image with a production image that packages and runs only the NestJS API. PostgreSQL, MySQL, MongoDB, Redis, and Microsoft SQL Server remain external services configured at runtime.

## Architecture

The Dockerfile uses two Node.js 22 stages based on Debian Bookworm:

1. The builder installs the locked dependency tree, compiles the NestJS application, and removes development dependencies.
2. The runtime uses the slim Node.js image and receives only the compiled application, production dependencies, package metadata, and public assets.

Using the same operating-system family in both stages keeps native Node.js dependencies compatible. The image does not install database servers, database clients, Ubuntu packages, Supervisor, or custom process-management scripts.

## Runtime

The API runs as the unprivileged built-in `node` user with `NODE_ENV=production` and default `PORT=3333`. The runtime creates a writable `public/uploads` directory owned by that user.

The container exposes only the API port and starts one process:

```text
node dist/main.js
```

NestJS receives all database hosts, ports, credentials, and external service settings through runtime environment variables such as `docker run --env-file .env`. No `.env` file or secret is copied into the image.

## Health Check

The healthcheck uses the Node.js runtime to request the API root endpoint on `127.0.0.1:${PORT}`. It requires no additional operating-system package. The container becomes healthy only after NestJS has started successfully, including its mandatory external database connections.

## Error Handling

The build fails when dependency installation or TypeScript compilation fails. The container exits when the single Node.js process terminates. Database connection failures remain visible through the NestJS startup logs and prevent the healthcheck from succeeding.

## Scope

Only `Dockerfile` is changed for this request. Existing database orchestration files and current user changes elsewhere in the worktree are not modified or committed.

## Verification

Verification includes:

1. `npm run build`.
2. The existing Jest test suite.
3. Docker image build.
4. Image inspection confirming the non-root user, API-only exposed port, healthcheck, and startup command.
5. A filesystem/package inspection confirming that PostgreSQL, MySQL, MongoDB, Redis, and Supervisor executables are absent.
