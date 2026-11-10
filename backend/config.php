<?php
/**
 * Default configuration. Do NOT put your real password here —
 * copy config.local.example.php to config.local.php and edit that file.
 */
$config = [
    'db_host'      => '127.0.0.1',
    'db_port'      => 3306,
    'db_name'      => 'coldpress_banner',
    'db_user'      => 'root',
    'db_pass'      => '',
    // Frontend origins allowed to call the API (Next.js dev server)
    'cors_origins' => ['http://localhost:3000', 'http://127.0.0.1:3000'],
];

if (is_file(__DIR__ . '/config.local.php')) {
    $config = array_merge($config, require __DIR__ . '/config.local.php');
}

return $config;
