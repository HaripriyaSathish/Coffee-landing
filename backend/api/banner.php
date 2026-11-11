<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/api.php';
api_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_out(['error' => 'Method not allowed'], 405);
}

try {
    json_out(['ok' => true, 'data' => banner_payload()]);
} catch (Throwable $e) {
    error_log('[banner] ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Database unavailable', 'reason' => db_failure_reason($e)], 503);
}
