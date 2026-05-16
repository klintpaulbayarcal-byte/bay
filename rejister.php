<?php
session_start();

$fullname = trim($_POST['fullname'] ?? '');
$email = trim($_POST['email'] ?? '');
$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$confirmPassword = $_POST['confirmPassword'] ?? '';

// Validate empty fields
if (empty($fullname) || empty($email) || empty($username) || empty($password) || empty($confirmPassword)) {
    echo "All fields are required";
    exit;
}

// Check if passwords match
if ($password !== $confirmPassword) {
    echo "Passwords do not match";
    exit;
}

// Connect to database
$conn = new mysqli("localhost", "root", "", "web_system");
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Check if username already exists
$checkStmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$checkStmt->bind_param("s", $username);
$checkStmt->execute();
$checkStmt->store_result();

if ($checkStmt->num_rows > 0) {
    echo "Username already exists";
    $checkStmt->close();
    $conn->close();
    exit;
}
$checkStmt->close();

// Hash password and insert user
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$role = "user";

$stmt = $conn->prepare("INSERT INTO users (fullname, email, username, password, role) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $fullname, $email, $username, $hashedPassword, $role);

if ($stmt->execute()) {
    echo "Registration successful! <a href='lagin.html'>Go to Login</a>";
} else {
    echo "Error: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
