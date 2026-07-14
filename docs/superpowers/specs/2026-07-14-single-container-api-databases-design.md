# Single-Container API and Databases Design

## Goal

Package the NestJS API, PostgreSQL, MySQL, MongoDB, and Redis in one Docker image and run them in one container. Microsoft SQL Server and the AdventureWorks database remain external services.

This deployment model targets local development, demonstrations, and simple single-host deployments. It is not intended for horizontally scaled or high-availability production workloads.

## Scope

The container includes:

- The compiled NestJS API.
- PostgreSQL for the default TypeORM connection.
- MySQL for the named `mysql` TypeORM connection.
- MongoDB for Mongoose modules.
- Redis for Bull queues and the cache store.
- Supervisor as the process manager.

The container does not include:

- Microsoft SQL Server or an AdventureWorks data image.
- MariaDB, because the application does not currently consume the `MARIADB_*` variables.
- AWS services or other external integrations.

## Image Architecture

The Dockerfile uses a multi-stage build. A Node.js builder stage installs dependencies with `npm ci` and compiles the NestJS application. The runtime stage contains Node.js, the four database servers, their local client utilities, Supervisor, the compiled application, production Node.js dependencies, and public assets.

Only files required at runtime are copied from the builder. The production `.env` file is excluded from the build context and is never stored in the image.

## Process Lifecycle

The container entrypoint performs idempotent initialization before starting Supervisor:

1. Create persistent data and runtime directories with the ownership required by each server.
2. Initialize PostgreSQL and MySQL data directories only when they are empty.
3. Start the database services under Supervisor.
4. Wait for PostgreSQL, MySQL, MongoDB, and Redis readiness with bounded retries.
5. Create the configured PostgreSQL and MySQL database/user when absent.
6. Start the NestJS API after all internal dependencies are ready.

Supervisor forwards service output to the container's standard output and standard error. A failed long-running process is restarted according to a bounded, explicit policy. Container shutdown sends termination signals to all managed processes so the databases and API can shut down cleanly.

## Configuration

Runtime configuration is supplied with `docker run --env-file .env`; secrets are not embedded in Dockerfile layers.

The application and initialization scripts use the production variable names already present in `.env`:

- Application: `PORT`.
- PostgreSQL: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, `POSTGRES_NAME`.
- MySQL: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`.
- MongoDB: `MONGODB_URI`.
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- External SQL Server: `MSSQL_HOST`, `MSSQL_PORT`, `MSSQL_USERNAME`, `MSSQL_PASSWORD`, `MSSQL_DATABASE`.

For the bundled services, host values must resolve locally within the container. The provided example uses `127.0.0.1`. The external SQL Server host remains configurable and must not be rewritten to localhost.

`.env.example` will be synchronized with the variable names consumed by the code and will contain safe placeholders rather than production credentials. Existing JWT, API-key, HTTP Basic, cache, throttling, logging, AWS SES, and AWS S3 variable names from production configuration will be documented without copying their secrets.

## Persistence and Networking

All server data is stored below `/data` in service-specific directories. The image declares `/data` as a volume so callers can attach one named Docker volume and preserve state across container replacement.

The API port is exposed using `PORT`, with `3333` as the documented default. Database ports may be exposed for debugging, but the API communicates with the bundled services over loopback. Publishing database ports to the host remains optional.

## Health and Failure Handling

Initialization stops with a clear error when a required variable is missing, a data directory cannot be initialized, or a bundled service does not become ready within the retry limit. Credentials are not printed in logs.

The Docker healthcheck verifies the HTTP API after startup. Supervisor status and native readiness commands remain available for diagnosing individual database services.

The API is not considered ready merely because its Node.js process exists; it must respond over HTTP after all mandatory database connections have been established.

## Repository Changes

Implementation will add or update:

- `Dockerfile` for the multi-stage image.
- `.dockerignore` to exclude secrets, local data, build output, and development-only files.
- Entrypoint and Supervisor configuration under `docker/all-in-one/`.
- `.env.example` to match the application's actual environment-variable contract.
- Minimal application configuration changes only if required to make container startup deterministic.

No production secret values will be committed.

## Verification

Verification consists of:

1. Run the existing NestJS build and relevant automated tests.
2. Build the Docker image from a clean context.
3. Start it with an environment file containing non-production test credentials.
4. Confirm PostgreSQL, MySQL, MongoDB, and Redis readiness.
5. Confirm the API health endpoint responds and startup logs show successful mandatory connections.
6. Restart the container with the same volume and confirm persisted data remains available.
7. Stop the container and confirm all managed processes terminate without forced corruption warnings.

## Operational Constraint

All services share one container lifecycle, resource limit, failure domain, and persistent volume. Scaling the API also duplicates every database, so this design must be replaced with separate service containers before introducing replicas or high-availability requirements.
