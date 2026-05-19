<?php
session_start();

require_once __DIR__ . '/auth_bootstrap.php';

$username = trim($_POST['username'] ?? '');
// also trim password to avoid accidental spaces
$password = trim($_POST['password'] ?? '');

if (empty($username) || empty($password)) {
    echo "Username and password are required";
    exit;
}

try {
    $conn = get_auth_database_connection();
    ensure_default_login_accounts($conn);
} catch (RuntimeException $exception) {
    die($exception->getMessage());
}

// Query user by username
$stmt = $conn->prepare("SELECT id, fullname, password, role, must_change_password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($id, $fullname, $hashedPassword, $role, $mustChangePassword);
    $stmt->fetch();
    
    // Verify password
    if ($hashedPassword && password_verify($password, $hashedPassword)) {
        // save useful information in session
        $_SESSION['username'] = $username;
        $_SESSION['fullname'] = $fullname;
        $_SESSION['role'] = $role;
        $_SESSION['id'] = $id;
        $_SESSION['force_password_change'] = ((int)$mustChangePassword === 1);

        if (!empty($_SESSION['force_password_change'])) {
            header("Location: change_password.php?status=force");
            exit();
        }
        
        // Redirect based on role
        if ($role === 'admin') {
            header("Location: admin_dashboard.php");
        } elseif ($role === 'staff') {
            header("Location: staff_panel.php");
        } else {
            header("Location: cafe.php");
        }
        exit();
    } else {
        echo "Invalid username or password";
    }
} else {
    echo "Invalid username or password";
}

$stmt->close();
$conn->close();
?>
