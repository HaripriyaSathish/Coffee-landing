<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
require_login();

/* ------------------------------------------------------------------
 * Section definitions. Column names come only from this whitelist,
 * so they are safe to put in SQL; all values go through prepared stmts.
 * ------------------------------------------------------------------ */
$sections = [
    'settings'  => ['title' => 'Banner & Navbar Text', 'icon' => '✎'],
    'nav'       => ['title' => 'Navbar Links', 'icon' => '☰', 'table' => 'nav_links', 'crud' => true,
        'list' => ['label', 'url', 'sort_order', 'is_active'],
        'fields' => [
            'label'      => ['Label', 'text', true],
            'url'        => ['URL / anchor', 'text', true],
            'sort_order' => ['Order', 'number'],
            'is_active'  => ['Visible', 'checkbox'],
        ]],
    'flavors'   => ['title' => 'Flavors (3D bottle)', 'icon' => '◉', 'table' => 'flavors', 'crud' => true,
        'list' => ['name', 'headline', 'price', 'liquid_color', 'sort_order', 'is_active'],
        'fields' => [
            'name'         => ['Flavor name', 'text', true],
            'subtitle'     => ['Subtitle', 'text'],
            'headline'     => ['Banner headline', 'text', true],
            'description'  => ['Description', 'textarea', true],
            'price'        => ['Price', 'decimal'],
            'volume'       => ['Volume', 'text'],
            'caffeine'     => ['Caffeine', 'text'],
            'liquid_color' => ['Coffee liquid colour', 'color'],
            'label_color'  => ['Bottle label colour', 'color'],
            'accent_color' => ['Accent colour', 'color'],
            'bg_color'     => ['Background colour', 'color'],
            'sort_order'   => ['Order', 'number'],
            'is_active'    => ['Visible', 'checkbox'],
        ]],
    'stats'     => ['title' => 'Stat Chips', 'icon' => '#', 'table' => 'banner_stats', 'crud' => true,
        'list' => ['value', 'label', 'sort_order', 'is_active'],
        'fields' => [
            'value'      => ['Value (e.g. 18h)', 'text', true],
            'label'      => ['Label', 'text', true],
            'sort_order' => ['Order', 'number'],
            'is_active'  => ['Visible', 'checkbox'],
        ]],
    'steps'     => ['title' => 'Process Animation', 'icon' => '▶', 'table' => 'process_steps', 'crud' => false,
        'list' => ['scene_key', 'step_label', 'title', 'duration_sec', 'bg_color', 'sort_order'],
        'fields' => [
            'step_label'   => ['Step label (progress bar)', 'text', true],
            'title'        => ['Title', 'text', true],
            'description'  => ['Description', 'textarea', true],
            'duration_sec' => ['Duration (seconds)', 'decimal'],
            'bg_color'     => ['Background colour during step', 'color'],
            'sort_order'   => ['Order', 'number'],
        ]],
    'preorders' => ['title' => 'Pre-order Sign-ups', 'icon' => '✉'],
    'account'   => ['title' => 'Account', 'icon' => '⚙'],
];

$settingLabels = [
    'brand_name'         => 'Brand name (logo)',
    'brand_tagline'      => 'Brand tagline (under logo)',
    'nav_cta_text'       => 'Navbar button text',
    'nav_cta_url'        => 'Navbar button link',
    'eyebrow'            => 'Eyebrow text above headline',
    'primary_cta_text'   => 'Pre-order button text',
    'secondary_cta_text' => 'Secondary link text',
    'secondary_cta_url'  => 'Secondary link URL',
    'form_placeholder'   => 'Email field placeholder',
    'form_success_text'  => 'Message after sign-up',
    'scroll_hint'        => 'Bottom hint text',
];

$section = $_GET['section'] ?? 'settings';
if (!isset($sections[$section])) {
    $section = 'settings';
}
$def = $sections[$section];
$pdo = db();
$self = 'index.php?section=' . urlencode($section);

/* ------------------------------ Actions ------------------------------ */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $action = $_POST['action'] ?? '';

    try {
        if ($section === 'settings' && $action === 'save_settings') {
            $stmt = $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                                   ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
            foreach ($settingLabels as $key => $_) {
                $stmt->execute([$key, trim((string) ($_POST[$key] ?? ''))]);
            }
            flash('Banner text saved.');
            redirect($self);
        }

        if (isset($def['table']) && $action === 'save') {
            $id = (int) ($_POST['id'] ?? 0);
            if ($id === 0 && empty($def['crud'])) {
                throw new RuntimeException('Rows in this section can only be edited.');
            }
            $cols = [];
            $vals = [];
            foreach ($def['fields'] as $col => [$label, $type]) {
                $required = $def['fields'][$col][2] ?? false;
                $raw = $_POST[$col] ?? null;
                $v = match ($type) {
                    'checkbox' => isset($_POST[$col]) ? 1 : 0,
                    'number'   => (int) $raw,
                    'decimal'  => round((float) $raw, 2),
                    'color'    => is_hex_color((string) $raw) ? strtolower((string) $raw) : throw new RuntimeException("$label must be a colour like #aa5533."),
                    default    => trim((string) $raw),
                };
                if ($required && $v === '') {
                    throw new RuntimeException("$label is required.");
                }
                $cols[] = $col;
                $vals[] = $v;
            }
            if ($id > 0) {
                $set = implode(', ', array_map(fn ($c) => "`$c` = ?", $cols));
                $pdo->prepare("UPDATE `{$def['table']}` SET $set WHERE id = ?")->execute([...$vals, $id]);
            } else {
                $ph = implode(', ', array_fill(0, count($cols), '?'));
                $names = implode(', ', array_map(fn ($c) => "`$c`", $cols));
                $pdo->prepare("INSERT INTO `{$def['table']}` ($names) VALUES ($ph)")->execute($vals);
            }
            flash('Saved.');
            redirect($self);
        }

        if (isset($def['table']) && !empty($def['crud']) && $action === 'delete') {
            $pdo->prepare("DELETE FROM `{$def['table']}` WHERE id = ?")->execute([(int) $_POST['id']]);
            flash('Deleted.');
            redirect($self);
        }

        if (isset($def['table']) && !empty($def['crud']) && $action === 'toggle') {
            $pdo->prepare("UPDATE `{$def['table']}` SET is_active = 1 - is_active WHERE id = ?")->execute([(int) $_POST['id']]);
            redirect($self);
        }

        if ($section === 'preorders' && $action === 'delete') {
            $pdo->prepare('DELETE FROM preorders WHERE id = ?')->execute([(int) $_POST['id']]);
            flash('Sign-up removed.');
            redirect($self);
        }

        if ($section === 'account' && $action === 'password') {
            $stmt = $pdo->prepare('SELECT password_hash FROM admins WHERE id = ?');
            $stmt->execute([$_SESSION['admin_id']]);
            if (!password_verify((string) $_POST['current'], (string) $stmt->fetchColumn())) {
                throw new RuntimeException('Current password is wrong.');
            }
            $new = (string) $_POST['new'];
            if (strlen($new) < 8) {
                throw new RuntimeException('New password must be at least 8 characters.');
            }
            $pdo->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')
                ->execute([password_hash($new, PASSWORD_DEFAULT), $_SESSION['admin_id']]);
            flash('Password changed.');
            redirect($self);
        }
    } catch (Throwable $ex) {
        flash($ex->getMessage(), 'err');
        $back = $self;
        if (!empty($_POST['id'])) {
            $back .= '&edit=' . (int) $_POST['id'];
        } elseif (($action ?? '') === 'save') {
            $back .= '&new=1';
        }
        redirect($back);
    }
}

/* CSV export of sign-ups */
if ($section === 'preorders' && isset($_GET['export'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="preorders.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['id', 'email', 'flavor', 'created_at']);
    foreach ($pdo->query('SELECT p.id, p.email, f.name, p.created_at FROM preorders p LEFT JOIN flavors f ON f.id = p.flavor_id ORDER BY p.id DESC') as $r) {
        fputcsv($out, array_values($r));
    }
    exit;
}

/* ------------------------------ Render ------------------------------ */
$flash = flash();
$editing = null;
if (isset($def['table'])) {
    if (isset($_GET['edit'])) {
        $stmt = $pdo->prepare("SELECT * FROM `{$def['table']}` WHERE id = ?");
        $stmt->execute([(int) $_GET['edit']]);
        $editing = $stmt->fetch() ?: null;
    } elseif (isset($_GET['new']) && !empty($def['crud'])) {
        $editing = ['id' => 0, 'is_active' => 1, 'sort_order' => 0,
            'liquid_color' => '#2a1408', 'label_color' => '#f1e4d1', 'accent_color' => '#d39a5c', 'bg_color' => '#120a06'];
    }
}

$counts = [
    'preorders' => (int) $pdo->query('SELECT COUNT(*) FROM preorders')->fetchColumn(),
    'flavors'   => (int) $pdo->query('SELECT COUNT(*) FROM flavors WHERE is_active = 1')->fetchColumn(),
];

function render_field(string $col, array $f, array $row): string
{
    [$label, $type] = $f;
    $req = !empty($f[2]) ? ' required' : '';
    $val = $row[$col] ?? '';
    $name = e($col);
    return match ($type) {
        'textarea' => "<label class=\"full\">$label<textarea name=\"$name\" rows=\"3\"$req>" . e((string) $val) . '</textarea></label>',
        'checkbox' => "<label class=\"check\"><input type=\"checkbox\" name=\"$name\"" . ((int) $val ? ' checked' : '') . "> $label</label>",
        'color'    => "<label>$label<span class=\"color-row\"><input type=\"color\" value=\"" . e((string) $val) . "\" oninput=\"this.nextElementSibling.value=this.value\"><input name=\"$name\" value=\"" . e((string) $val) . "\" pattern=\"#[0-9a-fA-F]{6}\" oninput=\"if(/^#[0-9a-f]{6}$/i.test(this.value))this.previousElementSibling.value=this.value\"$req></span></label>",
        'number'   => "<label>$label<input type=\"number\" name=\"$name\" value=\"" . e((string) $val) . "\"$req></label>",
        'decimal'  => "<label>$label<input type=\"number\" step=\"0.01\" name=\"$name\" value=\"" . e((string) $val) . "\"$req></label>",
        default    => "<label>$label<input name=\"$name\" value=\"" . e((string) $val) . "\"$req></label>",
    };
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ColdPress Admin · <?= e($def['title']) ?></title>
  <link rel="stylesheet" href="admin.css">
</head>
<body>
<div class="shell">
  <aside class="side">
    <div class="brand"><span class="dot"></span> COLDPRESS <small>Banner CMS</small></div>
    <nav>
      <?php foreach ($sections as $key => $s): ?>
        <a href="?section=<?= e($key) ?>" class="<?= $key === $section ? 'active' : '' ?>">
          <span class="ic"><?= $s['icon'] ?></span><?= e($s['title']) ?>
          <?php if ($key === 'preorders' && $counts['preorders']): ?><span class="badge"><?= $counts['preorders'] ?></span><?php endif; ?>
        </a>
      <?php endforeach; ?>
    </nav>
    <div class="side-foot">
      <a class="btn ghost small" href="http://localhost:3000" target="_blank" rel="noopener">View banner ↗</a>
      <form method="post" action="logout.php"><?= csrf_field() ?><button class="btn ghost small">Log out (<?= e($_SESSION['admin_name']) ?>)</button></form>
    </div>
  </aside>

  <main class="main">
    <header class="top">
      <h1><?= e($def['title']) ?></h1>
      <?php if (!empty($def['crud']) && !$editing): ?>
        <a class="btn primary" href="<?= e($self) ?>&new=1">+ Add new</a>
      <?php endif; ?>
      <?php if ($section === 'preorders'): ?>
        <a class="btn" href="<?= e($self) ?>&export=1">Export CSV</a>
      <?php endif; ?>
    </header>

    <?php if ($flash): ?><div class="flash <?= e($flash['type']) ?>"><?= e($flash['msg']) ?></div><?php endif; ?>

    <?php if ($section === 'settings'):
        $current = [];
        foreach ($pdo->query('SELECT setting_key, setting_value FROM settings') as $r) {
            $current[$r['setting_key']] = $r['setting_value'];
        } ?>
      <form method="post" class="card grid">
        <?= csrf_field() ?><input type="hidden" name="action" value="save_settings">
        <?php foreach ($settingLabels as $key => $label): ?>
          <label><?= e($label) ?><input name="<?= e($key) ?>" value="<?= e($current[$key] ?? '') ?>"></label>
        <?php endforeach; ?>
        <div class="full actions"><button class="btn primary">Save changes</button></div>
      </form>

    <?php elseif ($section === 'preorders'):
        $rows = $pdo->query('SELECT p.id, p.email, f.name AS flavor, p.created_at FROM preorders p
                             LEFT JOIN flavors f ON f.id = p.flavor_id ORDER BY p.id DESC LIMIT 500')->fetchAll(); ?>
      <div class="card">
        <p class="muted"><?= count($rows) ?> sign-up(s) from the banner form.</p>
        <table>
          <thead><tr><th>#</th><th>Email</th><th>Flavor</th><th>Date</th><th></th></tr></thead>
          <tbody>
          <?php foreach ($rows as $r): ?>
            <tr><td><?= (int) $r['id'] ?></td><td><?= e($r['email']) ?></td><td><?= e($r['flavor'] ?? '—') ?></td><td><?= e($r['created_at']) ?></td>
              <td class="row-actions"><form method="post" onsubmit="return confirm('Remove this sign-up?')"><?= csrf_field() ?>
                <input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
                <button class="btn danger small">Delete</button></form></td></tr>
          <?php endforeach; ?>
          <?php if (!$rows): ?><tr><td colspan="5" class="muted">No sign-ups yet.</td></tr><?php endif; ?>
          </tbody>
        </table>
      </div>

    <?php elseif ($section === 'account'): ?>
      <form method="post" class="card grid narrow">
        <?= csrf_field() ?><input type="hidden" name="action" value="password">
        <label class="full">Current password<input type="password" name="current" required></label>
        <label class="full">New password (min 8 chars)<input type="password" name="new" minlength="8" required></label>
        <div class="full actions"><button class="btn primary">Change password</button></div>
      </form>

    <?php elseif ($editing !== null): ?>
      <form method="post" class="card grid">
        <?= csrf_field() ?><input type="hidden" name="action" value="save"><input type="hidden" name="id" value="<?= (int) $editing['id'] ?>">
        <?php if ($section === 'steps'): ?>
          <p class="full muted">3D scene: <b><?= e($editing['scene_key']) ?></b> (fixed — it controls which animation plays).</p>
        <?php endif; ?>
        <?php foreach ($def['fields'] as $col => $f) echo render_field($col, $f, $editing); ?>
        <div class="full actions">
          <button class="btn primary">Save</button>
          <a class="btn ghost" href="<?= e($self) ?>">Cancel</a>
        </div>
      </form>

    <?php else:
        $rows = $pdo->query("SELECT * FROM `{$def['table']}` ORDER BY sort_order, id")->fetchAll(); ?>
      <div class="card">
        <table>
          <thead><tr>
            <?php foreach ($def['list'] as $c): ?><th><?= e($def['fields'][$c][0] ?? ucwords(str_replace('_', ' ', $c))) ?></th><?php endforeach; ?>
            <th></th></tr></thead>
          <tbody>
          <?php foreach ($rows as $r): ?>
            <tr class="<?= isset($r['is_active']) && !$r['is_active'] ? 'off' : '' ?>">
              <?php foreach ($def['list'] as $c): $v = (string) $r[$c]; ?>
                <td><?php if (str_ends_with($c, '_color')): ?><span class="swatch" style="background:<?= e($v) ?>"></span><?= e($v) ?>
                    <?php elseif ($c === 'is_active'): ?>
                      <form method="post" class="inline"><?= csrf_field() ?><input type="hidden" name="action" value="toggle"><input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
                        <button class="pill <?= $v ? 'on' : '' ?>"><?= $v ? 'Visible' : 'Hidden' ?></button></form>
                    <?php else: ?><?= e(mb_strimwidth($v, 0, 60, '…')) ?><?php endif; ?></td>
              <?php endforeach; ?>
              <td class="row-actions">
                <a class="btn small" href="<?= e($self) ?>&edit=<?= (int) $r['id'] ?>">Edit</a>
                <?php if (!empty($def['crud'])): ?>
                  <form method="post" onsubmit="return confirm('Delete this item?')"><?= csrf_field() ?>
                    <input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int) $r['id'] ?>">
                    <button class="btn danger small">Delete</button></form>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$rows): ?><tr><td colspan="<?= count($def['list']) + 1 ?>" class="muted">Nothing here yet.</td></tr><?php endif; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </main>
</div>
</body>
</html>
