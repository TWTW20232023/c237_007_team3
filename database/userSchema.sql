-- User table for Authentication feature (Xylon)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role)
);

-- Default admin account for initial access
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@library.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcIO7EgZgxzdBVS4G7AOPCwV6G.', 'admin');

-- Default admin password: adminpassword