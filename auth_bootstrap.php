<?php

function get_auth_database_connection(): mysqli
{
    $host = getenv('DB_HOST') ?: 'localhost';
    $user = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASSWORD') ?: '';
    $database = getenv('DB_NAME') ?: 'web_system';
    $port = (int) (getenv('DB_PORT') ?: 3306);

    $conn = new mysqli($host, $user, $password, $database, $port);

    if ($conn->connect_error) {
        throw new RuntimeException('Database connection failed: ' . $conn->connect_error);
    }

    return $conn;
}

function ensure_users_table_exists(mysqli $conn): void
{
    $conn->query("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fullname VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        must_change_password TINYINT(1) NOT NULL DEFAULT 0
    )");
}

function ensure_users_table_column(mysqli $conn, string $columnName, string $columnDefinition): void
{
    $safeColumnName = $conn->real_escape_string($columnName);
    $columnCheck = $conn->query("SHOW COLUMNS FROM users LIKE '" . $safeColumnName . "'");

    if ($columnCheck && $columnCheck->num_rows === 0) {
        $conn->query('ALTER TABLE users ADD COLUMN ' . $columnDefinition);
    }
}

function upsert_default_user(mysqli $conn, string $fullname, string $email, string $username, string $plainPassword, string $role, int $mustChangePassword = 0): void
{
    $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);

    $stmt = $conn->prepare('INSERT INTO users (fullname, email, username, password, role, must_change_password) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE fullname = VALUES(fullname), email = VALUES(email), password = VALUES(password), role = VALUES(role), must_change_password = VALUES(must_change_password)');

    if (!$stmt) {
        throw new RuntimeException('Failed to prepare default user upsert: ' . $conn->error);
    }

    $stmt->bind_param('sssssi', $fullname, $email, $username, $hashedPassword, $role, $mustChangePassword);

    if (!$stmt->execute()) {
        $error = $stmt->error;
        $stmt->close();
        throw new RuntimeException('Failed to seed default user: ' . $error);
    }

    $stmt->close();
}

function ensure_default_login_accounts(mysqli $conn): void
{
    ensure_users_table_exists($conn);
    ensure_users_table_column($conn, 'must_change_password', 'must_change_password TINYINT(1) NOT NULL DEFAULT 0');

    upsert_default_user($conn, 'Administrator', 'admin@example.com', 'jireh', 'faith', 'admin', 0);
    upsert_default_user($conn, 'Jai', 'jai@example.com', 'jai', '212121', 'staff', 0);
}
