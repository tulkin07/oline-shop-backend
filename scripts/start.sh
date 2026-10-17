#!/bin/sh
set -e

# Prisma waits only 10s for the migration advisory lock. On Neon the pooler
# (pgbouncer) keeps killed sessions alive, so an orphaned backend can hold the
# advisory lock forever and every deploy fails with P1002. Render deploys run
# one instance at a time, so the lock is not needed - disable it and keep the
# retry loop for cold-start timeouts.
export PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK="${PRISMA_SCHEMA_DISABLE_ADVISORY_LOCK:-1}"
MIGRATE_ATTEMPTS="${MIGRATE_ATTEMPTS:-6}"
MIGRATE_RETRY_DELAY="${MIGRATE_RETRY_DELAY:-10}"

attempt=1
until npx prisma migrate deploy; do
  if [ "$attempt" -ge "$MIGRATE_ATTEMPTS" ]; then
    echo "prisma migrate deploy failed after $attempt attempts"
    exit 1
  fi
  echo "prisma migrate deploy failed (attempt $attempt/$MIGRATE_ATTEMPTS). Retrying in ${MIGRATE_RETRY_DELAY}s..."
  attempt=$((attempt + 1))
  sleep "$MIGRATE_RETRY_DELAY"
done

ENTRY="$(find dist -name 'main.js' | head -n 1)"
if [ -z "$ENTRY" ]; then
  echo "Cannot find compiled entry. dist contents:"
  find dist -type f | head -50 || true
  exit 1
fi

echo "Starting $ENTRY"
exec node "$ENTRY"
