<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database credentials (defaults for local development)
$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_user = getenv('DB_USER') ?: 'root';
$db_password = getenv('DB_PASS') ?: '';
$db_name = getenv('DB_NAME') ?: 'if0_41979375_websystem';
$db_port = getenv('DB_PORT') ?: 3306;

try {
    // Connect to database
    $conn = new mysqli($db_host, $db_user, $db_password, $db_name, $db_port);
    
    if ($conn->connect_error) {
        throw new Exception('Database connection failed: ' . $conn->connect_error);
    }
    
    // Get action from request
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? ($_GET['action'] ?? null);
    
    if ($action === 'login') {
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;
        
        if (!$username || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Username and password required']);
            exit;
        }
        
        // Query user
        $stmt = $conn->prepare('SELECT id, fullname, password, role, must_change_password FROM users WHERE username = ?');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            $stmt->close();
            exit;
        }
        
        $user = $result->fetch_assoc();
        $stmt->close();
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            exit;
        }
        
        // Login successful
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $username;
        $_SESSION['role'] = $user['role'];
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'role' => $user['role'],
            'fullname' => $user['fullname'],
            'redirect_to' => ($user['role'] === 'admin') ? 'admin_dashboard.php' : 'menu.php',
            'force_password_change' => (bool)$user['must_change_password']
        ]);
    } else if ($action === 'register') {
        $fullname = $input['fullname'] ?? null;
        $email = $input['email'] ?? null;
        $username = $input['username'] ?? null;
        $password = $input['password'] ?? null;
        
        if (!$fullname || !$email || !$username || !$password) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'All fields required']);
            exit;
        }
        
        // Hash password
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $conn->prepare('INSERT INTO users (fullname, email, username, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, 0)');
        $stmt->bind_param('sssss', $fullname, $email, $username, $hashed, $role = 'customer');
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Registration successful']);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $stmt->error]);
        }
        $stmt->close();
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
    
    $conn->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
