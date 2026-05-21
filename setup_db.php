<?php
// Database configuration - hardcoded for reliability
$db_host = 'sql107.infinityfree.com';
$db_user = 'if0_41979375';
$db_password = 'bebepogi2004';
$db_name = 'if0_41979375_websystem';
$db_port = 3306;

header('Content-Type: application/json');

try {
    // Connect to MySQL server (without specifying database yet)
    $conn = new mysqli($db_host, $db_user, $db_password, '', $db_port);
    
    if ($conn->connect_error) {
        throw new Exception('Connection failed: ' . $conn->connect_error);
    }
    
    // Create database if it doesn't exist
    $sql = "CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    if (!$conn->query($sql)) {
        throw new Exception('Create database failed: ' . $conn->error);
    }
    
    // Select database
    $conn->select_db($db_name);
    
    // Create users table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        must_change_password TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    if (!$conn->query($sql)) {
        throw new Exception('Create table failed: ' . $conn->error);
    }
    
    // Insert default admin user if doesn't exist
    $default_admin = 'jireh';
    $default_password = password_hash('faith', PASSWORD_DEFAULT);
    
    $stmt = $conn->prepare('SELECT id FROM users WHERE username = ?');
    $stmt->bind_param('s', $default_admin);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        $stmt = $conn->prepare('INSERT INTO users (fullname, email, username, password, role) VALUES (?, ?, ?, ?, ?)');
        $fullname = 'Administrator';
        $email = 'admin@cafe.local';
        $role = 'admin';
        $stmt->bind_param('sssss', $fullname, $email, $default_admin, $default_password, $role);
        $stmt->execute();
    }
    $stmt->close();
    
    $conn->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database and tables initialized successfully',
        'database' => $db_name,
        'default_user' => $default_admin
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
