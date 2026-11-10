<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

if (!empty($_SESSION['admin_id'])) {
    redirect('index.php');
}

$error = null;
$dbError = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_check();
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    try {
        $stmt = db()->prepare('SELECT id, username, password_hash FROM admins WHERE username = ?');
        $stmt->execute([$username]);
        $admin = $stmt->fetch();
        if ($admin && password_verify($password, $admin['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['admin_id'] = (int) $admin['id'];
            $_SESSION['admin_name'] = $admin['username'];
            redirect('index.php');
        }
        $error = 'Wrong username or password.';
    } catch (Throwable $ex) {
        $dbError = $ex->getMessage();
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ColdPress Admin · Sign in</title>
  <link rel="stylesheet" href="admin.css">
</head>
<body class="login-body">
  <form class="login-card" method="post" autocomplete="off">
    <div class="brand"><span class="dot"></span> COLDPRESS <small>Banner CMS</small></div>
    <h1>Sign in</h1>
    <?php if ($error): ?><div class="flash err"><?= e($error) ?></div><?php endif; ?>
    <?php if ($dbError): ?>
      <div class="flash err">Database connection failed: <?= e($dbError) ?><br>
        Check <code>backend/config.local.php</code> and run <code>database.sql</code> in MySQL Workbench.</div>
    <?php endif; ?>
    <?= csrf_field() ?>
    <label>Username <input name="username" required autofocus></label>
    <label>Password <input name="password" type="password" required></label>
    <button class="btn primary" type="submit">Sign in</button>
  </form>
</body>
</html>
