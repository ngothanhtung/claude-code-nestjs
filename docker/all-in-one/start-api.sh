#!/usr/bin/env bash
set -Eeuo pipefail

retry() {
  local description="$1"
  shift

  local attempt
  for ((attempt = 1; attempt <= 60; attempt++)); do
    if "$@" >/dev/null 2>&1; then
      return 0
    fi

    if ((attempt < 60)); then
      sleep 1
    fi
  done

  printf 'Timed out waiting for %s\n' "$description" >&2
  return 1
}

validate_identifier() {
  local variable_name="$1"
  local value="${!variable_name-}"

  if [[ ! "$value" =~ ^[A-Za-z0-9_]+$ ]]; then
    printf '%s must contain only letters, numbers, and underscores\n' "$variable_name" >&2
    exit 64
  fi
}

postgres_ready() {
  pg_isready \
    --host="$POSTGRES_HOST" \
    --port="$POSTGRES_PORT" \
    --username="$POSTGRES_USERNAME"
}

postgres_authenticated() {
  PGPASSWORD="$POSTGRES_PASSWORD" psql \
    --host="$POSTGRES_HOST" \
    --port="$POSTGRES_PORT" \
    --username="$POSTGRES_USERNAME" \
    --dbname="$POSTGRES_NAME" \
    --no-password \
    --tuples-only \
    --command='SELECT 1'
}

mysql_socket_ready() {
  mysqladmin \
    --protocol=socket \
    --socket=/run/mysqld/mysqld.sock \
    --user=root \
    ping || MYSQL_PWD="$MYSQL_PASSWORD" mysqladmin \
      --protocol=socket \
      --socket=/run/mysqld/mysqld.sock \
      --user=root \
      ping
}

mysql_tcp_authenticated() {
  MYSQL_PWD="$MYSQL_PASSWORD" mysqladmin \
    --protocol=tcp \
    --host="$MYSQL_HOST" \
    --port="$MYSQL_PORT" \
    --user="$MYSQL_USERNAME" \
    ping
}

redis_authenticated() {
  REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli \
    --no-auth-warning \
    --host "$REDIS_HOST" \
    --port "$REDIS_PORT" \
    ping
}

mongo_authenticated() {
  mongosh "$MONGODB_URI" --quiet --eval \
    'if (db.runCommand({ ping: 1 }).ok !== 1) { throw new Error("MongoDB ping failed"); }'
}

mongo_unauthenticated() {
  mongosh --quiet --host 127.0.0.1 --port 27017 --eval \
    'if (db.runCommand({ ping: 1 }).ok !== 1) { throw new Error("MongoDB ping failed"); }'
}

mongo_ready() {
  mongo_authenticated || mongo_unauthenticated
}

for identifier_variable in \
  POSTGRES_USERNAME \
  POSTGRES_NAME \
  MYSQL_USERNAME \
  MYSQL_DATABASE; do
  validate_identifier "$identifier_variable"
done

retry 'PostgreSQL' postgres_ready

PGPASSWORD="$POSTGRES_PASSWORD" psql \
  --host="$POSTGRES_HOST" \
  --port="$POSTGRES_PORT" \
  --username="$POSTGRES_USERNAME" \
  --dbname=postgres \
  --no-password \
  --set=ON_ERROR_STOP=1 \
  --set=database_name="$POSTGRES_NAME" <<'SQL'
SELECT format('CREATE DATABASE %I', :'database_name')
WHERE NOT EXISTS (
  SELECT 1 FROM pg_database WHERE datname = :'database_name'
)
\gexec
SQL

retry 'authenticated PostgreSQL' postgres_authenticated
retry 'MySQL socket' mysql_socket_ready

if [[ -e /data/mysql/.needs-bootstrap ]]; then
  mysql_root_uses_password=false
  if ! mysql \
    --protocol=socket \
    --socket=/run/mysqld/mysqld.sock \
    --user=root \
    --execute='SELECT 1' >/dev/null 2>&1; then
    mysql_root_uses_password=true
  fi

  mysql_as_root() {
    if [[ "$mysql_root_uses_password" == true ]]; then
      MYSQL_PWD="$MYSQL_PASSWORD" mysql \
        --protocol=socket \
        --socket=/run/mysqld/mysqld.sock \
        --user=root "$@"
    else
      mysql \
        --protocol=socket \
        --socket=/run/mysqld/mysqld.sock \
        --user=root "$@"
    fi
  }

  escaped_mysql_password=${MYSQL_PASSWORD//\'/\'\'}

  if [[ "$MYSQL_USERNAME" == root ]]; then
    mysql_as_root <<SQL
SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES';
CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\`;
ALTER USER 'root'@'localhost' IDENTIFIED BY '$escaped_mysql_password';
FLUSH PRIVILEGES;
SQL
  else
    mysql_as_root <<SQL
SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES';
CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\`;
CREATE USER IF NOT EXISTS '$MYSQL_USERNAME'@'%' IDENTIFIED BY '$escaped_mysql_password';
ALTER USER '$MYSQL_USERNAME'@'%' IDENTIFIED BY '$escaped_mysql_password';
GRANT ALL PRIVILEGES ON \`$MYSQL_DATABASE\`.* TO '$MYSQL_USERNAME'@'%';
ALTER USER 'root'@'localhost' IDENTIFIED BY '$escaped_mysql_password';
FLUSH PRIVILEGES;
SQL
  fi

  rm -f /data/mysql/.needs-bootstrap
fi

retry 'authenticated MySQL' mysql_tcp_authenticated
retry 'Redis' redis_authenticated
retry 'MongoDB' mongo_ready

cleanup_mongo_credentials() {
  rm -f \
    /run/mongodb/bootstrap-username \
    /run/mongodb/bootstrap-password \
    /run/mongodb/bootstrap-auth-source
  unset MONGO_BOOTSTRAP_USERNAME
  unset MONGO_BOOTSTRAP_PASSWORD
  unset MONGO_BOOTSTRAP_AUTH_SOURCE
}
trap cleanup_mongo_credentials EXIT

umask 077
node <<'NODE'
const fs = require('node:fs');

const uri = new URL(process.env.MONGODB_URI);
const credentials = {
  '/run/mongodb/bootstrap-username': decodeURIComponent(uri.username),
  '/run/mongodb/bootstrap-password': decodeURIComponent(uri.password),
  '/run/mongodb/bootstrap-auth-source': uri.searchParams.get('authSource') ?? '',
};

for (const [path, value] of Object.entries(credentials)) {
  if (!value || /[\0\r\n]/u.test(value)) {
    throw new Error('MONGODB_URI contains invalid bootstrap credentials');
  }
  fs.writeFileSync(path, value, { mode: 0o600 });
}
NODE

if ! mongo_authenticated >/dev/null 2>&1; then
  MONGO_BOOTSTRAP_USERNAME="$(</run/mongodb/bootstrap-username)"
  MONGO_BOOTSTRAP_PASSWORD="$(</run/mongodb/bootstrap-password)"
  MONGO_BOOTSTRAP_AUTH_SOURCE="$(</run/mongodb/bootstrap-auth-source)"
  export MONGO_BOOTSTRAP_USERNAME
  export MONGO_BOOTSTRAP_PASSWORD
  export MONGO_BOOTSTRAP_AUTH_SOURCE

  mongosh --quiet --host 127.0.0.1 --port 27017 --eval '
    const authDb = db.getSiblingDB(process.env.MONGO_BOOTSTRAP_AUTH_SOURCE);
    authDb.createUser({
      user: process.env.MONGO_BOOTSTRAP_USERNAME,
      pwd: process.env.MONGO_BOOTSTRAP_PASSWORD,
      roles: [{ role: "root", db: "admin" }],
    });
  '
fi

cleanup_mongo_credentials
trap - EXIT

retry 'authenticated MongoDB' mongo_authenticated

exec node dist/main.js
