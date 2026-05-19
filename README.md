# Bay / Klint's Cafe

The final site entry is `http://localhost/bay/`, which redirects to the built React frontend at `frontend/dist/index.html#/`.

## Run

1. Start Apache and MySQL in XAMPP.
2. Build the React app:

```powershell
cd C:\xampp\htdocs\bay\frontend
npm run build
```

3. Open the site:

```text
http://localhost/bay/
```

If you need the direct build URL, use:

```text
http://localhost/bay/frontend/dist/index.html#/
```

## Hosting Checklist

### XAMPP
- Put the project in `htdocs/bay` so the `/bay` paths line up.
- Import or create the `web_system` database before first login.
- Run `setup.php` once if you want the app to create tables and seed accounts.
- Build the frontend before opening the site so `frontend/dist` exists.
- Make sure Apache and MySQL are both running.

### cPanel / Shared Hosting
- Upload the full project folder, including `frontend/dist`.
- Set the document root or site path to point to the project root.
- Confirm PHP has permission to create tables in the target database.
- Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `DB_PORT` if your host does not use localhost defaults.
- Verify the host allows PHP sessions and cookie storage.
- Rebuild the frontend locally before upload whenever UI code changes.
- Test login with `jireh / faith` for admin and `jai / 212121` for staff after deployment.
# Web System - User Registration & Admin Management

A complete PHP-based web system with user registration, login, and admin dashboard functionality.

## Setup Instructions

### 1. Create Database
Run the SQL schema from `sql_schema.sql`:
```sql
CREATE DATABASE IF NOT EXISTS web_system;
USE web_system;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Insert Admin User
After creating the table, manually insert one admin user:
```sql
INSERT INTO users (fullname, email, username, password, role) 
VALUES ('Administrator', 'admin@example.com', 'jireh', '$2y$10$...', 'admin');
```

*Or use PHP password_hash():*
```sql
INSERT INTO users (fullname, email, username, password, role) 
VALUES ('Admin User', 'admin@example.com', 'admin', '$2y$10$...', 'admin');
```

## File Structure

### User-Facing Pages
- **signup.html** - Registration form with validation
- **login.html** - Login form
- **menu.html** - User dashboard after login

### Admin Pages
- **admin_dashboard.php** - View all users in a table with EDIT button
- **edit_user.php** - Edit user details and role
- **update_user.php** - Backend for user updates

### Backend Scripts
- **register.php** - Handles user registration with password hashing
- **login.php** - Authenticates user, redirects based on role
- **logout.php** - Destroys session and redirects to login

### Database
- **sql_schema.sql** - Database and table creation script

## Features

✓ User Registration with validation
✓ Password hashing using password_hash()
✓ Login authentication with password_verify()
✓ Role-based redirect (user -> cafe.php, admin -> admin_dashboard.php)
✓ Admin dashboard to view all registered users
✓ Edit user details (fullname, email, username, role)
✓ Session management
✓ Responsive Bootstrap UI

## Access Points

- **New Users**: `/web_system/signup.html`
- **Existing Users**: `/web_system/login.html`
- **Admin Credentials**: username: `jireh`, password: `faith`
- **Staff Credentials (example)**: username: `jai`, password: `212121`
