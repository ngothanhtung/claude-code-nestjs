# API-Only Docker Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the all-in-one Dockerfile with a production multi-stage image that contains and runs only the NestJS API.

**Architecture:** Build the TypeScript application and prune development dependencies in Node 22 Bookworm. Copy only production artifacts into Node 22 Bookworm Slim, run as the built-in non-root user, and connect to every database through runtime environment variables.

**Tech Stack:** Docker multi-stage build, Node.js 22.23.1, NestJS 11, Debian Bookworm Slim.

---

### Task 1: Replace the All-in-One Dockerfile

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Confirm the current Dockerfile contains bundled services**

Run:

```bash
rg 'mysql-server|postgresql|redis-server|mongodb-org|supervisor|all-in-one' Dockerfile
```

Expected before editing: matches for database packages, Supervisor, and all-in-one scripts.

- [ ] **Step 2: Replace `Dockerfile` with the API-only image**

Use this complete content:

```dockerfile
FROM node:22.23.1-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY public ./public

RUN npm run build && npm prune --omit=dev


FROM node:22.23.1-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3333

WORKDIR /app

COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir -p public/uploads && chown node:node public/uploads

USER node

EXPOSE 3333

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD ["node", "-e", "const http=require('node:http');const request=http.get({hostname:'127.0.0.1',port:process.env.PORT||3333,path:'/'},response=>process.exit(response.statusCode>=200&&response.statusCode<400?0:1));request.setTimeout(4000,()=>request.destroy(new Error('timeout')));request.on('error',()=>process.exit(1));"]

CMD ["node", "dist/main.js"]
```

- [ ] **Step 3: Assert the static API-only contract**

Run:

```bash
test "$(rg -c '^FROM ' Dockerfile)" -eq 2
test "$(rg -c '^EXPOSE 3333$' Dockerfile)" -eq 1
test "$(rg -c '^USER node$' Dockerfile)" -eq 1
test "$(rg -c '^CMD \[\"node\", \"dist/main.js\"\]$' Dockerfile)" -eq 1
! rg 'mysql-server|postgresql|redis-server|mongodb-org|supervisor|container-entrypoint|start-api|VOLUME|EXPOSE .*5432|EXPOSE .*3306|EXPOSE .*27017|EXPOSE .*6379' Dockerfile
```

Expected: every assertion exits 0 and the negated search produces no output.

- [ ] **Step 4: Run application checks**

Run:

```bash
npm run build
npm test -- --runInBand
git diff --check -- Dockerfile
```

Expected: TypeScript build succeeds, one Jest suite with five tests passes, and no whitespace error is reported.

- [ ] **Step 5: Build and inspect the image**

Run:

```bash
docker build --progress=plain -t claude-code-nestjs:api .
docker image inspect claude-code-nestjs:api \
  --format '{{.Config.User}} {{json .Config.Cmd}} {{json .Config.ExposedPorts}} {{json .Config.Healthcheck.Test}}'
```

Expected: build succeeds; inspection reports user `node`, command `["node","dist/main.js"]`, only `3333/tcp`, and a Node-based healthcheck.

- [ ] **Step 6: Confirm database servers and Supervisor are absent**

Run:

```bash
docker run --rm --entrypoint sh claude-code-nestjs:api -c '
  for executable in postgres mysqld mongod redis-server supervisord; do
    if command -v "$executable" >/dev/null 2>&1; then
      echo "unexpected executable: $executable" >&2
      exit 1
    fi
  done
'
```

Expected: exit code 0 and no output.

- [ ] **Step 7: Commit only the Dockerfile**

Run:

```bash
git add Dockerfile
git commit -m "refactor: package only NestJS API in Docker image"
```

Expected: the commit contains only `Dockerfile`; current user changes and deleted all-in-one support files remain outside this commit.
