<?php
/**
 * Configuration.
 *
 * Local development: MySQL, using the values below + backend/config.local.php (your password, not committed).
 * Hosting (Render): set environment variables instead —
 *   DATABASE_URL   postgresql://user:pass@host/db?sslmode=require   (e.g. Neon)  -> PostgreSQL is used
 *   CORS_ORIGINS   comma-separated frontend URLs allowed to call the API, e.g. https://coldpress-web.onrender.com
 */
$config = [
    'db_host'      => '127.0.0.1',
    'db_port'      => 3306,
    'db_name'      => 'coldpress_banner',
    'db_user'      => 'root',
    'db_pass'      => '',
    'database_url' => getenv('DATABASE_URL') ?: '',
    // Frontend origins allowed to call the API (Next.js dev server)
    'cors_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
];

if (is_file(__DIR__ . '/config.local.php')) {
    $config = array_merge($config, require __DIR__ . '/config.local.php');
}

$extraOrigins = getenv('CORS_ORIGINS');
if ($extraOrigins) {
    $config['cors_origins'] = array_merge(
        $config['cors_origins'],
        array_values(array_filter(array_map(fn ($o) => rtrim(trim($o), '/'), explode(',', $extraOrigins))))
    );
}

return $config;
