# syntax=docker/dockerfile:1.6

# ===========================================
# Stage 1: Build
# ===========================================
FROM node:22-alpine AS builder

# Native modules (sqlite3, mssql) cần build tools
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /usr/src/app

# Cài tất cả dependencies (bao gồm devDependencies cho build)
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# Copy source code và build
COPY tsconfig.json nest-cli.json ./
COPY src ./src
RUN yarn build

# Sau build xong, xóa devDependencies để giảm kích thước node_modules
RUN yarn install --frozen-lockfile --production --ignore-scripts

# ===========================================
# Stage 2: Production runtime (image nhỏ)
# ===========================================
FROM node:22-alpine AS production

ENV NODE_ENV=production \
    PORT=3333

RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy node_modules đã được prune (chỉ production deps)
COPY --from=builder --chown=node:node /usr/src/app/node_modules ./node_modules
# Copy compiled JavaScript
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist
COPY --from=builder --chown=node:node /usr/src/app/package.json ./

# Thư mục upload (MulterModule) — cần write permission
RUN mkdir -p /usr/src/app/public/uploads \
    && chown -R node:node /usr/src/app/public

USER node

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:'+process.env.PORT, r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/main.js"]
