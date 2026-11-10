#!/bin/sh
# Starts both parts of the single Render web service.
set -e

# PHP API + admin: private, only reachable inside the container (Next.js forwards /api and /admin to it)
php -S 127.0.0.1:8000 -t /app/backend &

# the public website on Render's port
cd /app/frontend
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT:-10000}"
