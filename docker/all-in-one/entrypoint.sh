#!/usr/bin/env bash
set -Eeuo pipefail

readonly required_variables=(
  POSTGRES_HOST
  POSTGRES_PORT
  POSTGRES_USERNAME
  POSTGRES_PASSWORD
  POSTGRES_NAME
  MYSQL_HOST
  MYSQL_PORT
  MYSQL_USERNAME
  MYSQL_PASSWORD
  MYSQL_DATABASE
  MONGODB_URI
  REDIS_HOST
  REDIS_PORT
  REDIS_PASSWORD
  MSSQL_HOST
  MSSQL_PORT
  MSSQL_USERNAME
  MSSQL_PASSWORD
  MSSQL_DATABASE
)

for variable_name in "${required_variables[@]}"; do
  if [[ -z "${!variable_name:-}" ]]; then
    printf '%s\n' "$variable_name" >&2
    exit 64
  fi
done

require_loopback_host() {
  local variable_name="$1"
  local value="${!variable_name}"

  if [[ "$value" != 'localhost' && "$value" != '127.0.0.1' ]]; then
    printf '%s must be localhost or 127.0.0.1\n' "$variable_name" >&2
    exit 64
  fi
}

require_port() {
  local variable_name="$1"
  local value="${!variable_name}"

  if [[ ! "$value" =~ ^[0-9]{1,5}$ ]] || (( 10#$value < 1 || 10#$value > 65535 )); then
    printf '%s must be a valid TCP port\n' "$variable_name" >&2
    exit 64
  fi
}

require_loopback_host POSTGRES_HOST
require_loopback_host MYSQL_HOST
require_loopback_host REDIS_HOST

require_port POSTGRES_PORT
require_port MYSQL_PORT
require_port REDIS_PORT
require_port MSSQL_PORT

if ! node -e '
  try {
    const uri = new URL(process.argv[1]);
    const isLocal = uri.hostname === "localhost" || uri.hostname === "127.0.0.1";
    const isValid = uri.protocol === "mongodb:"
      && isLocal
      && uri.port === "27017"
      && uri.username.length > 0
      && uri.password.length > 0
      && (uri.searchParams.get("authSource")?.length ?? 0) > 0;
    process.exit(isValid ? 0 : 1);
  } catch {
    process.exit(1);
  }
' "$MONGODB_URI"; then
  printf '%s\n' 'MONGODB_URI must contain local credentials, port 27017, and authSource' >&2
  exit 64
fi

for variable_name in POSTGRES_PASSWORD REDIS_PASSWORD; do
  if [[ "${!variable_name}" == *$'\n'* || "${!variable_name}" == *$'\r'* ]]; then
    printf '%s must not contain newline characters\n' "$variable_name" >&2
    exit 64
  fi
done

password_file=''
cleanup() {
  if [[ -n "${password_file:-}" ]]; then
    rm -f -- "$password_file"
  fi
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

install -d -m 0700 -o postgres -g postgres /data/postgresql
install -d -m 0750 -o mysql -g mysql /data/mysql /run/mysqld
install -d -m 0750 -o mongodb -g mongodb /data/mongodb /run/mongodb
install -d -m 0750 -o redis -g redis /data/redis /run/redis

if [[ ! -f /data/postgresql/PG_VERSION ]]; then
  password_file="$(mktemp /run/postgresql-password.XXXXXX)"
  chmod 0600 "$password_file"
  chown postgres:postgres "$password_file"
  printf '%s\n' "$POSTGRES_PASSWORD" >"$password_file"

  gosu postgres /usr/lib/postgresql/16/bin/initdb \
    -D /data/postgresql --username="$POSTGRES_USERNAME" \
    --pwfile="$password_file" --auth-host=scram-sha-256 --auth-local=trust

  rm -f -- "$password_file"
  password_file=''
fi

if [[ ! -d /data/mysql/mysql ]]; then
  gosu mysql mysqld --initialize-insecure --datadir=/data/mysql
  install -m 0600 -o mysql -g mysql /dev/null /data/mysql/.needs-bootstrap
fi

escaped_redis_password="${REDIS_PASSWORD//\\/\\\\}"
escaped_redis_password="${escaped_redis_password//\"/\\\"}"

umask 0077
{
  printf '%s\n' 'bind 127.0.0.1'
  printf 'port %s\n' "$REDIS_PORT"
  printf '%s\n' 'dir /data/redis'
  printf '%s\n' 'appendonly yes'
  printf '%s\n' 'protected-mode yes'
  printf 'requirepass "%s"\n' "$escaped_redis_password"
  printf '%s\n' 'daemonize no'
} >/run/redis/redis.conf
chown redis:redis /run/redis/redis.conf
chmod 0600 /run/redis/redis.conf

exec /usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf
