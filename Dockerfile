FROM node:22.23.1-bookworm AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY public ./public

RUN npm run build && npm prune --omit=dev


FROM ubuntu:24.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    PORT=3333

RUN set -eux; \
    printf '#!/bin/sh\nexit 101\n' > /usr/sbin/policy-rc.d; \
    chmod +x /usr/sbin/policy-rc.d; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        gosu \
        mysql-server \
        postgresql \
        postgresql-client \
        redis-server \
        supervisor; \
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc \
        | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg; \
    echo 'deb [arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse' \
        > /etc/apt/sources.list.d/mongodb-org-8.0.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends mongodb-org mongodb-mongosh; \
    rm -rf \
        /var/lib/apt/lists/* \
        /var/lib/mysql/* \
        /var/lib/mongodb/* \
        /var/lib/postgresql/*; \
    rm -f /usr/sbin/policy-rc.d

WORKDIR /app

COPY --from=builder /usr/local /usr/local
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

COPY docker/all-in-one/entrypoint.sh /usr/local/bin/container-entrypoint.sh
COPY docker/all-in-one/start-api.sh /usr/local/bin/start-api.sh
COPY docker/all-in-one/supervisord.conf /etc/supervisor/supervisord.conf

VOLUME ["/data"]

EXPOSE 3333 5432 3306 27017 6379

HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
  CMD curl --fail --silent --show-error "http://127.0.0.1:${PORT}/" >/dev/null || exit 1

ENTRYPOINT ["/usr/local/bin/container-entrypoint.sh"]
