<?php
// This script patches auth_bootstrap.php to fix the database host issue
// Call this as: curl https://web-proj.42web.io/bay/patch_auth.php

if ($_GET['key'] !== 'bebepogi2004') {
    die('Invalid key');
}

$file = 'auth_bootstrap.php';

if (!file_exists($file)) {
    die('File not found');
}

$current = file_get_contents($file);

// The fixed version with bulletproof DB connection logic
$fixed = '<?php

function normalize_mysql_host(string $host): string
{
    $value = trim($host);
    if ($value === \'\') {
        return \'\';
    }
    if (preg_match(\'#^[a-z]+://#i\', $value) === 1) {
        $parsedHost = parse_url($value, PHP_URL_HOST);
        if (is_string($parsedHost) && $parsedHost !== \'\') {
            $value = $parsedHost;
        }
    }
    $value = preg_replace(\'#/.*$#\', \'\', $value) ?? $value;
    return trim($value);
}

function get_auth_database_connection(): mysqli
{
    $defaultHost = getenv('DB_HOST') ?: '127.0.0.1';
    $user = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASS') ?: '';
    $database = getenv('DB_NAME') ?: 'if0_41979375_websystem';
    $port = getenv('DB_PORT') ?: 3306;

    $configuredHost = trim((string) (getenv(\'DB_HOST\') ?: \'\'));
    if ($configuredHost !== \'\' && $configuredHost !== $defaultHost) {
        $configuredHost = normalize_mysql_host($configuredHost);
    } else {
        $configuredHost = \'\';
    }

    $host = ($configuredHost !== \'\' && filter_var($configuredHost, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME)) ? $configuredHost : $defaultHost;

    $conn = @new mysqli($host, $user, $password, $database, $port);

    if ($conn->connect_error && $host !== $defaultHost) {
        $host = $defaultHost;
        $conn = @new mysqli($host, $user, $password, $database, $port);
    }

    if ($conn->connect_error) {
        $serverConn = @new mysqli($host, $user, $password, \'\', $port);

        if ($serverConn->connect_error) {
            throw new RuntimeException(\'Database connection failed: \' . $serverConn->connect_error);
        }

        $safeDatabase = preg_replace(\'/[^A-Za-z0-9_]/\', \'\', $database);

        if ($safeDatabase === \'\') {
            throw new RuntimeException(\'Invalid database name configured\');
        }

        if (!$serverConn->query("CREATE DATABASE IF NOT EXISTS `" . $safeDatabase . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")) {
            $error = $serverConn->error;
            $serverConn->close();
            throw new RuntimeException(\'Failed to create database: \' . $error);
        }

        $serverConn->close();

        $conn = new mysqli($host, $user, $password, $database, $port);

        if ($conn->connect_error) {
            throw new RuntimeException(\'Database connection failed: \' . $conn->connect_error);
        }
    }

    return $conn;
}

function ensure_default_login_accounts(): void
{
    try {
        $conn = get_auth_database_connection();
        
        $conn->query(\'CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fullname VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(20) DEFAULT "customer",
            must_change_password TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci\');

        $defaultUser = \'jireh\';
        $defaultPass = password_hash(\'faith\', PASSWORD_DEFAULT);

        $stmt = $conn->prepare(\'SELECT id FROM users WHERE username = ?\');
        $stmt->bind_param(\'s\', $defaultUser);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();
            $stmt = $conn->prepare(\'INSERT INTO users (fullname, email, username, password, role) VALUES (?, ?, ?, ?, ?)\');
            $fullname = \'Administrator\';
            $email = \'admin@cafe.local\';
            $role = \'admin\';
            $stmt->bind_param(\'sssss\', $fullname, $email, $defaultUser, $defaultPass, $role);
            $stmt->execute();
            $stmt->close();
        } else {
            $stmt->close();
        }

        $conn->close();
    } catch (Throwable $e) {
        error_log(\'Auth bootstrap error: \' . $e->getMessage());
    }
}

ensure_default_login_accounts();
?>';

if (file_put_contents($file, $fixed)) {
    echo json_encode(['success' => true, 'message' => 'auth_bootstrap.php patched successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to write file']);
}
?>
