<?php
// This script creates login_api.php on the server
// Access: https://web-proj.42web.io/bay/create_login.php?key=create_now

if (($_GET['key'] ?? '') !== 'create_now') {
    die('Access denied');
}

$content = '<?php
// Standalone login endpoint with hardcoded configuration
header(\'Content-Type: application/json\');
header(\'Access-Control-Allow-Origin: *\');
header(\'Access-Control-Allow-Methods: POST, GET, OPTIONS\');
header(\'Access-Control-Allow-Headers: Content-Type\');

if ($_SERVER[\'REQUEST_METHOD\'] === \'OPTIONS\') {
    http_response_code(200);
    exit;
}

$DB_HOST = getenv('DB_HOST') ?: '127.0.0.1';
$DB_USER = getenv('DB_USER') ?: 'root';
$DB_PASS = getenv('DB_PASS') ?: '';
$DB_NAME = getenv('DB_NAME') ?: 'if0_41979375_websystem';
$DB_PORT = 3306;

try {
    $conn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);
    
    if ($conn->connect_error) {
        throw new Exception(\'Connection failed: \' . $conn->connect_error);
    }
    
    $input = json_decode(file_get_contents(\'php://input\'), true) ?? [];
    $action = $input[\'action\'] ?? \'login\';
    $username = $input[\'username\'] ?? \'\';
    $password = $input[\'password\'] ?? \'\';
    
    if ($action === \'login\') {
        if (empty($username) || empty($password)) {
            http_response_code(400);
            echo json_encode([\'success\' => false, \'message\' => \'Missing credentials\']);
            exit;
        }
        
        $stmt = $conn->prepare(\'SELECT id, fullname, password, role, must_change_password FROM users WHERE username = ?\');
        $stmt->bind_param(\'s\', $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(401);
            echo json_encode([\'success\' => false, \'message\' => \'Invalid credentials\']);
            $stmt->close();
            exit;
        }
        
        $user = $result->fetch_assoc();
        $stmt->close();
        
        if (!password_verify($password, $user[\'password\'])) {
            http_response_code(401);
            echo json_encode([\'success\' => false, \'message\' => \'Invalid credentials\']);
            exit;
        }
        
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION[\'user_id\'] = $user[\'id\'];
        $_SESSION[\'username\'] = $username;
        $_SESSION[\'role\'] = $user[\'role\'];
        
        http_response_code(200);
        echo json_encode([
            \'success\' => true,
            \'message\' => \'Login successful\',
            \'role\' => $user[\'role\'],
            \'fullname\' => $user[\'fullname\'],
            \'redirect_to\' => ($user[\'role\'] === \'admin\') ? \'admin_dashboard.php\' : \'menu.php\',
            \'force_password_change\' => (bool)$user[\'must_change_password\']
        ]);
    } else {
        http_response_code(400);
        echo json_encode([\'success\' => false, \'message\' => \'Invalid action\']);
    }
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([\'success\' => false, \'message\' => \'Server error: \' . $e->getMessage()]);
}
?>';

if (file_put_contents(__DIR__ . '/login_api.php', $content)) {
    echo json_encode(['success' => true, 'message' => 'login_api.php created successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to create login_api.php']);
}
?>
