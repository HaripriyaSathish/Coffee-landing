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

/** True when running on PostgreSQL (DATABASE_URL set, e.g. Neon on Render); false for local MySQL. */
function db_is_pg(): bool
{
    return (string) app_config()['database_url'] !== '';
}

/** PDO DSN + credentials for a postgresql:// URL (Neon). */
function pg_connection(string $url): array
{
    $u = parse_url($url);
    if (!$u || empty($u['host'])) {
        throw new RuntimeException('DATABASE_URL is not a valid postgresql:// URL');
    }
    parse_str($u['query'] ?? '', $q);
    $parts = [
        'host=' . $u['host'],
        'port=' . ($u['port'] ?? 5432),
        'dbname=' . ltrim($u['path'] ?? '/postgres', '/'),
        'sslmode=' . ($q['sslmode'] ?? 'require'),
    ];
    // Neon needs the endpoint id when the client library is too old to send SNI; harmless otherwise
    if (str_contains($u['host'], '.neon.tech')) {
        $endpoint = preg_replace('/-pooler$/', '', explode('.', $u['host'])[0]);
        $parts[] = "options='endpoint=" . $endpoint . "'";
    }
    return ['pgsql:' . implode(';', $parts), urldecode($u['user'] ?? ''), urldecode($u['pass'] ?? '')];
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = app_config();
        if (db_is_pg()) {
            [$dsn, $user, $pass] = pg_connection($c['database_url']);
        } else {
            $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'], $c['db_port'], $c['db_name']);
            [$user, $pass] = [$c['db_user'], $c['db_pass']];
        }
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}

/** Quote a table / column name for the current database (names always come from code whitelists). */
function qi(string $name): string
{
    return db_is_pg() ? '"' . $name . '"' : '`' . $name . '`';
}

/** "Insert, but skip if it already exists" for the current database. */
function sql_insert_ignore(string $table, array $cols): string
{
    $names = implode(', ', $cols);
    $ph = implode(', ', array_fill(0, count($cols), '?'));
    return db_is_pg()
        ? "INSERT INTO $table ($names) VALUES ($ph) ON CONFLICT DO NOTHING"
        : "INSERT IGNORE INTO $table ($names) VALUES ($ph)";
}

/** "Insert or update by key" for the settings table. */
function sql_upsert_setting(): string
{
    return db_is_pg()
        ? 'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP'
        : 'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)';
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
