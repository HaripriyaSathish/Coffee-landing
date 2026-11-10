<?php
declare(strict_types=1);

function app_config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = require __DIR__ . '/../config.php';
    }
    return $cfg;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = app_config();
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'], $c['db_port'], $c['db_name']);
        $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

function is_hex_color(string $v): bool
{
    return (bool) preg_match('/^#[0-9a-fA-F]{6}$/', $v);
}

/** Everything the banner needs, in one structure. */
function banner_payload(): array
{
    $pdo = db();
    $settings = [];
    foreach ($pdo->query('SELECT setting_key, setting_value FROM settings') as $r) {
        $settings[$r['setting_key']] = $r['setting_value'];
    }
    $nav = $pdo->query('SELECT id, label, url FROM nav_links WHERE is_active = 1 ORDER BY sort_order, id')->fetchAll();
    $flavors = $pdo->query('SELECT id, name, subtitle, headline, description, price, volume, caffeine,
                                   liquid_color, label_color, accent_color, bg_color
                            FROM flavors WHERE is_active = 1 ORDER BY sort_order, id')->fetchAll();
    foreach ($flavors as &$f) {
        $f['id'] = (int) $f['id'];
        $f['price'] = (float) $f['price'];
    }
    unset($f);
    $stats = $pdo->query('SELECT value, label FROM banner_stats WHERE is_active = 1 ORDER BY sort_order, id')->fetchAll();
    $steps = $pdo->query('SELECT scene_key, step_label, title, description, duration_sec, bg_color
                          FROM process_steps ORDER BY sort_order, id')->fetchAll();
    foreach ($steps as &$s) {
        $s['duration_sec'] = (float) $s['duration_sec'];
    }
    unset($s);

    return compact('settings', 'nav', 'flavors', 'stats', 'steps');
}
