#!/bin/sh
set -e

# Prisma waits only 10s for the migration advisory lock. On Neon free tier the
# compute may be suspended (cold start) or a previous Render instance may still
# hold the lock, which surfaces as P1002. Retry a few times before giving up.
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
