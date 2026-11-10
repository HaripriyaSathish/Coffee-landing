# ColdPress banner — ONE Render web service for everything:
#   https://<app>.onrender.com/          the 3D banner (Next.js)
#   https://<app>.onrender.com/admin     admin panel (PHP)
#   https://<app>.onrender.com/api/...   API (PHP)
# Next.js listens on Render's $PORT and forwards /admin + /api to PHP, which runs privately on 127.0.0.1:8000.
# The database comes from the DATABASE_URL environment variable (Neon PostgreSQL).

# ---------- 1) build the website ----------
FROM node:20-bookworm-slim AS web
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# empty = call the API on the same address as the site
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build && npm prune --omit=dev

# ---------- 2) runtime: PHP + Node in one container ----------
FROM php:8.2-cli-bookworm
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq-dev \
 && docker-php-ext-install pdo_pgsql pdo_mysql \
 && rm -rf /var/lib/apt/lists/*
COPY --from=web /usr/local/bin/node /usr/local/bin/node

WORKDIR /app
COPY backend/ /app/backend/
RUN rm -f /app/backend/config.local.php
COPY --from=web /app/frontend /app/frontend
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV NODE_ENV=production \
    PORT=10000 \
    API_URL=http://127.0.0.1:8000 \
    FRONTEND_URL=/ \
    PHP_CLI_SERVER_WORKERS=4
EXPOSE 10000
CMD ["/app/start.sh"]
