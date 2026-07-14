# Single-Container API and Databases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one Docker image that runs the NestJS API, PostgreSQL, MySQL, MongoDB, and Redis while connecting to an external SQL Server.

**Architecture:** A Node 22 builder compiles the API and prunes development dependencies. An Ubuntu 24.04 runtime installs four database servers and Supervisor; an idempotent entrypoint prepares persistent storage, and a launcher provisions dependencies before starting NestJS.

**Tech Stack:** Docker, Node.js 22, NestJS 11, Ubuntu 24.04, PostgreSQL 16, MySQL 8, MongoDB 8.0 Community, Redis, Supervisor, Bash.

---

## File Map

- Create `.dockerignore`: exclude secrets and local artifacts.
- Modify `.env.example`: mirror the production variable names with safe values.
- Create `docker/all-in-one/entrypoint.sh`: validate variables and initialize storage.
- Create `docker/all-in-one/start-api.sh`: provision databases and gate API startup.
- Create `docker/all-in-one/supervisord.conf`: manage all five long-running processes.
- Modify `Dockerfile`: compile and assemble the runtime image.
- Modify `README.md`: document build, run, persistence, and limitations.

### Task 1: Align the Environment Contract

**Files:**
- Create: `.dockerignore`
- Modify: `.env.example`

- [ ] **Step 1: Capture the current mismatch**

Run:

```bash
rg '^(DB_|POSTGRES_|MYSQL_)' .env.example
```

Expected before editing: legacy `DB_*` names and no `MYSQL_*` names.

- [ ] **Step 2: Create `.dockerignore`**

```dockerignore
.git
.github
.idea
.vscode
.env
.env.*
!.env.example
node_modules
dist
coverage
logs
*.log
*.sqlite
docker/**/db_data
docs/superpowers
```

- [ ] **Step 3: Synchronize `.env.example`**

Preserve its sectioned dotenv format. Replace `DB_*` with `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`, and `POSTGRES_NAME`. Add the production groups `MYSQL_*`, `CACHE_*`, `THROTTLE_*`, JWT, login-attempt, API-key, HTTP Basic, logging, AWS SES, and AWS S3. Use `127.0.0.1` for bundled database hosts, the current numeric defaults without inline comments, and `change_*` placeholder credentials. Use:

```dotenv
MONGODB_URI=mongodb://root:change_mongodb_password@127.0.0.1:27017/claude_code_nestjs?authSource=admin
MSSQL_HOST=server.example.com
DB_LOGGING=false
```

Do not copy any value from `.env` for passwords, tokens, keys, or external hostnames.

- [ ] **Step 4: Verify names and secret exclusion**

Run:

```bash
rg '^(POSTGRES_|MYSQL_|MONGODB_URI|REDIS_|MSSQL_)' .env.example
rg '^(DB_HOST|DB_PORT|DB_USERNAME|DB_PASSWORD|DB_NAME)=' .env.example
docker build --no-cache -f - . <<'EOF'
FROM scratch
COPY . /
EOF
```

Expected: all five connection groups appear; the legacy-name command exits 1; `.env` is absent from the transferred context.

- [ ] **Step 5: Commit**

```bash
git add .dockerignore .env.example
git commit -m "chore: align container environment contract"
```

### Task 2: Initialize Persistent Services

**Files:**
- Create: `docker/all-in-one/entrypoint.sh`

- [ ] **Step 1: Write the strict entrypoint**

Start with `#!/usr/bin/env bash` and `set -Eeuo pipefail`. Require every variable in these groups before creating data: `POSTGRES_*`, `MYSQL_*`, `MONGODB_URI`, `REDIS_*`, and `MSSQL_*`. Exit 64 and print only the missing variable name. Accept only `localhost` or `127.0.0.1` for bundled hosts. Parse `MONGODB_URI` with Node's `URL`; require local host, port 27017, username, password, and `authSource`.

Create directories with these exact owners and modes:

```bash
install -d -m 0700 -o postgres -g postgres /data/postgresql
install -d -m 0750 -o mysql -g mysql /data/mysql /run/mysqld
install -d -m 0750 -o mongodb -g mongodb /data/mongodb /run/mongodb
install -d -m 0750 -o redis -g redis /data/redis /run/redis
```

When `/data/postgresql/PG_VERSION` is absent, write `POSTGRES_PASSWORD` to a mode-0600 temporary file and run:

```bash
gosu postgres /usr/lib/postgresql/16/bin/initdb \
  -D /data/postgresql --username="$POSTGRES_USERNAME" \
  --pwfile="$password_file" --auth-host=scram-sha-256 --auth-local=trust
```

When `/data/mysql/mysql` is absent, run `gosu mysql mysqld --initialize-insecure --datadir=/data/mysql` and create the mysql-owned marker `/data/mysql/.needs-bootstrap`.

Generate `/run/redis/redis.conf` mode 0600 owned by Redis with loopback bind, `REDIS_PORT`, `/data/redis`, append-only persistence, protected mode, `REDIS_PASSWORD`, and `daemonize no`. Finish with:

```bash
exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
```

- [ ] **Step 2: Check syntax and missing-variable failure**

Run:

```bash
chmod +x docker/all-in-one/entrypoint.sh
bash -n docker/all-in-one/entrypoint.sh
env -i PATH="$PATH" bash docker/all-in-one/entrypoint.sh
```

Expected: syntax succeeds; the empty-environment invocation exits 64 naming `POSTGRES_HOST` without printing a secret.

- [ ] **Step 3: Commit**

```bash
git add docker/all-in-one/entrypoint.sh
git commit -m "feat: initialize bundled database storage"
```

### Task 3: Provision Databases and Gate NestJS

**Files:**
- Create: `docker/all-in-one/start-api.sh`

- [ ] **Step 1: Implement bounded retries**

Create a `retry DESCRIPTION COMMAND...` Bash function that attempts the command 60 times, sleeps one second between attempts, suppresses probe output, and returns a clear timeout error. Add native probes using `pg_isready`, `mysqladmin` over `/run/mysqld/mysqld.sock`, authenticated `redis-cli`, and MongoDB. The Mongo probe must first try `mongosh "$MONGODB_URI"`; if authentication has not been bootstrapped, it may fall back to an unauthenticated loopback ping.

- [ ] **Step 2: Validate SQL identifiers**

Before interpolating SQL, enforce `^[A-Za-z0-9_]+$` for `POSTGRES_USERNAME`, `POSTGRES_NAME`, `MYSQL_USERNAME`, and `MYSQL_DATABASE`; exit 64 otherwise. Escape single quotes in `MYSQL_PASSWORD` by doubling them. This permits safe identifier interpolation in the bootstrap statements.

- [ ] **Step 3: Provision PostgreSQL and MySQL idempotently**

After PostgreSQL is ready, connect to database `postgres` with `PGPASSWORD`, `ON_ERROR_STOP=1`, and `psql`'s `format('%I', ...)` plus `\gexec` to create `POSTGRES_NAME` only when absent.

After the MySQL socket is ready, act only when `.needs-bootstrap` exists: create `MYSQL_DATABASE`, set the localhost root password, create `MYSQL_USERNAME` for host `%` when it is not `root`, grant that user all privileges on the configured database, flush privileges, and remove the marker only after success. On later starts, verify TCP access using `MYSQL_PWD`, host, port, and configured username.

- [ ] **Step 4: Bootstrap MongoDB authentication safely**

Use Node's `URL` to decode username, password, and `authSource` from `MONGODB_URI` into mode-0600 files under `/run/mongodb`; reject NUL and newline characters. If authenticated ping fails, use MongoDB's localhost exception to call `createUser` in `authSource`, reading credentials through process environment rather than interpolating JavaScript. Remove temporary credential files and unset their environment variables. Require an authenticated ping before proceeding.

- [ ] **Step 5: Start the API**

After authenticated PostgreSQL, MySQL, MongoDB, and Redis probes pass, run:

```bash
exec node dist/main.js
```

- [ ] **Step 6: Validate and commit**

Run:

```bash
chmod +x docker/all-in-one/start-api.sh
bash -n docker/all-in-one/start-api.sh
git add docker/all-in-one/start-api.sh
git commit -m "feat: gate API startup on bundled databases"
```

Expected: Bash syntax exits 0 before the commit.

### Task 4: Configure Process Supervision

**Files:**
- Create: `docker/all-in-one/supervisord.conf`

- [ ] **Step 1: Define the service programs**

Create `[supervisord]` with foreground mode, `/run/supervisord.pid`, and no file log. Define exactly these programs:

```ini
[program:postgresql]
command=/usr/lib/postgresql/16/bin/postgres -D /data/postgresql -h 127.0.0.1 -p %(ENV_POSTGRES_PORT)s
user=postgres

[program:mysql]
command=/usr/sbin/mysqld --datadir=/data/mysql --socket=/run/mysqld/mysqld.sock --bind-address=127.0.0.1 --port=%(ENV_MYSQL_PORT)s
user=mysql

[program:mongodb]
command=/usr/bin/mongod --dbpath /data/mongodb --bind_ip 127.0.0.1 --port 27017 --auth --unixSocketPrefix /run/mongodb
user=mongodb

[program:redis]
command=/usr/bin/redis-server /run/redis/redis.conf
user=redis

[program:api]
command=/usr/local/bin/start-api.sh
directory=/app
user=root
```

Give database programs priority 10 and API priority 50. For every program set `autostart=true`, `autorestart=unexpected`, `stopasgroup=true`, `killasgroup=true`, and route stdout/stderr to `/dev/stdout` and `/dev/stderr` with zero rotation. Use `INT` to stop PostgreSQL and `TERM` for the other programs. Set API `startsecs=10` and `startretries=3`.

- [ ] **Step 2: Validate and commit**

Run:

```bash
test "$(rg -c '^\[program:' docker/all-in-one/supervisord.conf)" -eq 5
git add docker/all-in-one/supervisord.conf
git commit -m "feat: supervise API and database processes"
```

Expected: the count assertion succeeds.

### Task 5: Build the All-in-One Image

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Add the Node builder**

```dockerfile
FROM node:22.23.1-bookworm AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY public ./public
RUN npm run build && npm prune --omit=dev
```

- [ ] **Step 2: Add the Ubuntu runtime**

Use `ubuntu:24.04`. Install `ca-certificates curl gnupg gosu postgresql postgresql-client mysql-server redis-server supervisor` noninteractively while a temporary `/usr/sbin/policy-rc.d` exits 101. Add MongoDB's official 8.0 Noble repository using its key at `https://www.mongodb.org/static/pgp/server-8.0.asc`, then install `mongodb-org` and `mongodb-mongosh`. Remove package lists, default database data, and the temporary service policy in the same layer.

- [ ] **Step 3: Complete runtime assembly**

Copy `/usr/local` from the Node builder, then copy builder `package.json`, `node_modules`, `dist`, and `public` into `/app`. Copy the two executable scripts to `/usr/local/bin` and Supervisor config to `/etc/supervisor/supervisord.conf`. Declare `/data` as a volume; expose 3333, 5432, 3306, 27017, and 6379. Add:

```dockerfile
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
  CMD curl --fail --silent --show-error "http://127.0.0.1:${PORT}/" >/dev/null || exit 1
ENTRYPOINT ["/usr/local/bin/container-entrypoint.sh"]
```

- [ ] **Step 4: Build and inspect**

Run:

```bash
docker build --progress=plain -t claude-code-nestjs:all-in-one .
docker image inspect claude-code-nestjs:all-in-one \
  --format '{{json .Config.Entrypoint}} {{json .Config.Healthcheck.Test}} {{json .Config.Volumes}}'
```

Expected: build succeeds; output identifies the entrypoint, healthcheck, and `/data` volume.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile
git commit -m "feat: build all-in-one API database image"
```

### Task 6: End-to-End Verification and Documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run repository checks**

```bash
npm ci
npm run build
npm test -- --runInBand
```

Expected: build and Jest pass.

- [ ] **Step 2: Run with production-shaped environment and persistence**

```bash
docker volume create claude-code-data
docker rm -f claude-code-api 2>/dev/null || true
docker run -d --name claude-code-api --env-file .env \
  -p 3333:3333 -v claude-code-data:/data \
  claude-code-nestjs:all-in-one
```

Expected: Docker returns a container ID. `MSSQL_HOST` must be reachable from the container.

- [ ] **Step 3: Verify every service**

```bash
docker exec claude-code-api supervisorctl status
docker inspect claude-code-api --format '{{.State.Health.Status}}'
curl --fail http://127.0.0.1:3333/
docker exec claude-code-api bash -lc 'PGPASSWORD="$POSTGRES_PASSWORD" pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USERNAME"'
docker exec claude-code-api bash -lc 'MYSQL_PWD="$MYSQL_PASSWORD" mysqladmin -h "$MYSQL_HOST" -P "$MYSQL_PORT" -u "$MYSQL_USERNAME" ping'
docker exec claude-code-api bash -lc 'mongosh "$MONGODB_URI" --quiet --eval "db.adminCommand({ ping: 1 })"'
docker exec claude-code-api bash -lc 'REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping'
```

Expected: five programs are `RUNNING`, health is `healthy`, API returns `Hello World!`, and all four native probes pass.

- [ ] **Step 4: Verify restart persistence**

Restart the container, poll health for up to 150 seconds, and repeat Step 3. Expected: health returns to `healthy`; logs contain no `initdb`, `--initialize-insecure`, or duplicate-user failure.

- [ ] **Step 5: Document operation**

Add a README section named `Docker: API and databases in one container` with the exact build, run, status, and probe commands above. Explain `/data`, external `MSSQL_HOST`, optional host publication of database ports, and that `.env` is runtime-only. Include this warning verbatim:

```markdown
This image is intended for development, demos, and simple single-host deployments. The API and all bundled databases share one lifecycle, resource limit, failure domain, and volume; split them into separate services before scaling or adding high availability.
```

- [ ] **Step 6: Final checks and commit**

```bash
git diff --check
npm run build
docker inspect claude-code-api --format '{{.State.Health.Status}}'
git status --short
git add README.md
git commit -m "docs: explain all-in-one container operation"
```

Expected: no whitespace errors, build passes, container is healthy, and only intended work remains before the documentation commit.
