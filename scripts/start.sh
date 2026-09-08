#!/bin/sh
set -e
npx prisma migrate deploy

ENTRY="$(find dist -name 'main.js' | head -n 1)"
if [ -z "$ENTRY" ]; then
  echo "Cannot find compiled entry. dist contents:"
  find dist -type f | head -50 || true
  exit 1
fi

echo "Starting $ENTRY"
exec node "$ENTRY"
