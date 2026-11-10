<?php
declare(strict_types=1);

require_once __DIR__ . '/../lib/api.php';
api_headers();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'Method not allowed'], 405);
}

$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body)) {
    $body = $_POST;
}

$email = trim((string) ($body['email'] ?? ''));
$flavorId = isset($body['flavor_id']) ? (int) $body['flavor_id'] : null;

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) {
    json_out(['ok' => false, 'error' => 'Please enter a valid email.'], 422);
}

try {
    $pdo = db();
    if ($flavorId !== null) {
        $chk = $pdo->prepare('SELECT id FROM flavors WHERE id = ? AND is_active = 1');
        $chk->execute([$flavorId]);
        if (!$chk->fetch()) {
            $flavorId = null;
        }
    }
    $stmt = $pdo->prepare('INSERT IGNORE INTO preorders (email, flavor_id, ip_address) VALUES (?, ?, ?)');
    $stmt->execute([strtolower($email), $flavorId, $_SERVER['REMOTE_ADDR'] ?? null]);

    $msg = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'form_success_text'")->fetchColumn();
    json_out(['ok' => true, 'message' => $msg ?: 'Thanks! You are on the list.']);
} catch (Throwable $e) {
    error_log('[preorder] ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Could not save right now. Try again soon.'], 503);
}
