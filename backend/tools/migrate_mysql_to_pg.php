<?php
/**
 * Copies every row from the local MySQL database to PostgreSQL (e.g. Neon).
 *
 *  - MySQL is only READ (SELECT). Nothing in your local database is changed.
 *  - PostgreSQL: creates the tables if needed (database.pg.sql), then replaces their rows with
 *    the MySQL rows (same ids), so it is safe to run again whenever you want to refresh Neon.
 *
 * Usage (from the backend folder):
 *   DATABASE_URL="postgresql://..." php -d extension=pdo_pgsql tools/migrate_mysql_to_pg.php
 */
declare(strict_types=1);

require __DIR__ . '/../lib/db.php';

$c = app_config();
if (!db_is_pg()) {
    fwrite(STDERR, "Set DATABASE_URL to the PostgreSQL connection string first.\n");
    exit(1);
}

// source: local MySQL (read-only use)
$my = new PDO(
    sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'], $c['db_port'], $c['db_name']),
    $c['db_user'],
    $c['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

// target: PostgreSQL
$pg = db();
$pg->exec(file_get_contents(__DIR__ . '/../database.pg.sql'));

// parents before children (preorders references flavors)
$tables = ['admins', 'settings', 'nav_links', 'flavors', 'banner_stats', 'process_steps', 'preorders'];

$pg->beginTransaction();
try {
    $pg->exec('TRUNCATE ' . implode(', ', $tables) . ' RESTART IDENTITY CASCADE');
    foreach ($tables as $t) {
        $rows = $my->query("SELECT * FROM `$t`")->fetchAll();
        if ($rows) {
            $cols = array_keys($rows[0]);
            $sql = sprintf(
                'INSERT INTO "%s" (%s) VALUES (%s)',
                $t,
                implode(', ', array_map(fn ($x) => '"' . $x . '"', $cols)),
                implode(', ', array_fill(0, count($cols), '?'))
            );
            $ins = $pg->prepare($sql);
            foreach ($rows as $r) {
                $ins->execute(array_values($r));
            }
        }
        // keep auto-numbering in step with the copied ids
        if ($t !== 'settings') {
            $pg->query("SELECT setval(pg_get_serial_sequence('$t', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM \"$t\"), 0), 1), (SELECT COUNT(*) > 0 FROM \"$t\"))");
        }
        printf("%-14s %d rows copied\n", $t, count($rows));
    }
    $pg->commit();
} catch (Throwable $e) {
    $pg->rollBack();
    fwrite(STDERR, 'Migration failed, nothing was changed in PostgreSQL: ' . $e->getMessage() . "\n");
    exit(1);
}

// verify: row counts must match
$ok = true;
foreach ($tables as $t) {
    $a = (int) $my->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    $b = (int) $pg->query("SELECT COUNT(*) FROM \"$t\"")->fetchColumn();
    if ($a !== $b) {
        $ok = false;
        echo "MISMATCH $t: mysql=$a postgres=$b\n";
    }
}
echo $ok ? "All tables match.\n" : "Some tables differ!\n";
