# ColdPress banner — PHP API + admin panel, for a Render "Web Service" (Docker runtime).
# The database comes from the DATABASE_URL environment variable (Neon PostgreSQL).
FROM php:8.2-apache

# PostgreSQL (Neon) + MySQL drivers
RUN apt-get update \
 && apt-get install -y --no-install-recommends libpq-dev \
 && docker-php-ext-install pdo_pgsql pdo_mysql \
 && rm -rf /var/lib/apt/lists/*

# Render tells the service which port to listen on via $PORT (default 10000)
ENV PORT=10000
RUN sed -i 's/Listen 80/Listen ${PORT}/' /etc/apache2/ports.conf \
 && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/' /etc/apache2/sites-available/000-default.conf

COPY . /var/www/html/
# never ship a local password file
RUN rm -f /var/www/html/config.local.php

EXPOSE 10000
