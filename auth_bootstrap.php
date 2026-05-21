<?php

function normalize_mysql_host(string $host): string
{
    $value = trim($host);

    if ($value === '') {
        return '';
    }

    if (preg_match('#^[a-z]+://#i', $value) === 1) {
        $parsedHost = parse_url($value, PHP_URL_HOST);
        if (is_string($parsedHost) && $parsedHost !== '') {
            $value = $parsedHost;
        }
    }

    $value = preg_replace('#/.*$#', '', $value) ?? $value;

    return trim($value);
}

function get_auth_database_connection(): mysqli
{
    $defaultHost = 'sql107.infinityfree.com';
    $defaultUser = 'if0_41979375';
    $defaultPassword = 'bebepogi2004';
    $defaultDatabase = 'if0_41979375_websystem';
    $defaultPort = 3306;

    $configuredHost = normalize_mysql_host((string) (getenv('DB_HOST') ?: ''));
    $configuredUser = trim((string) (getenv('DB_USER') ?: ''));
    $configuredPassword = (string) (getenv('DB_PASSWORD') ?: '');
    $configuredDatabase = trim((string) (getenv('DB_NAME') ?: ''));
    $configuredPort = (int) (getenv('DB_PORT') ?: 0);

    $host = ($configuredHost !== '' && filter_var($configuredHost, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) ? $configuredHost : $defaultHost;
    $user = $configuredUser !== '' ? $configuredUser : $defaultUser;
    $password = $configuredPassword !== '' ? $configuredPassword : $defaultPassword;
    $database = $configuredDatabase !== '' ? $configuredDatabase : $defaultDatabase;
    $port = $configuredPort > 0 ? $configuredPort : $defaultPort;

    $conn = @new mysqli($host, $user, $password, $database, $port);

    if ($conn->connect_error) {
        $serverConn = @new mysqli($host, $user, $password, '', $port);

        if ($serverConn->connect_error) {
            throw new RuntimeException('Database connection failed: ' . $serverConn->connect_error);
        }

        $safeDatabase = preg_replace('/[^A-Za-z0-9_]/', '', $database);

        if ($safeDatabase === '') {
            throw new RuntimeException('Invalid database name configured');
        }

        if (!$serverConn->query("CREATE DATABASE IF NOT EXISTS `" . $safeDatabase . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")) {
            $error = $serverConn->error;
            $serverConn->close();
            throw new RuntimeException('Failed to create database: ' . $error);
        }

        $serverConn->close();

        $conn = new mysqli($host, $user, $password, $database, $port);

        if ($conn->connect_error) {
            throw new RuntimeException('Database connection failed: ' . $conn->connect_error);
        }
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
