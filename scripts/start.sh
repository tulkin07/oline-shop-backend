#!/bin/sh
set -e
npx prisma migrate deploy
if [ -f dist/main.js ]; then
  exec node dist/main.js
fi
if [ -f dist/src/main.js ]; then
  exec node dist/src/main.js
fi
echo "Cannot find compiled entry. dist contents:"
ls -la dist || true
ls -la dist/src || true
exit 1
