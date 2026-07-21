const db = require('../../../config/db');
const bcrypt = require('bcrypt');

class UserModel {
    // Hash a plain password with bcrypt (salt rounds: 10)
    static hashPassword(password) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hashed) => {
                if (err) reject(err);
                resolve(hashed);
            });
        });
    }

    // Verify a plain password against a stored hash
    static verifyPassword(plainPassword, passwordHash) {
        return new Promise((resolve, reject) => {
            bcrypt.compare(plainPassword, passwordHash, (err, isMatch) => {
                if (err) reject(err);
                resolve(isMatch);
            });
        });
    }

    // Register a new user
static createUser({ username, email, password, role = 'user' }) {
    return new Promise(async (resolve, reject) => {
        try {
            const passwordHash = await this.hashPassword(password);
            const sql = `INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)`;
            
            db.connection.execute(sql, [username, email, passwordHash, role], (err, result) => {
                // Add 'return' so it stops executing if there's an error
                if (err) return reject(err); 
                resolve({ id: result.insertId, username, email, role });
            });
        } catch (err) {
            reject(err);
        }
    });
}
    // Find user by email
    static findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        return new Promise((resolve, reject) => {
            db.connection.execute(sql, [email], (err, results) => {
                if (err) reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Find user by username
    static findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        return new Promise((resolve, reject) => {
            db.connection.execute(sql, [username], (err, results) => {
                if (err) reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Find user by ID
    static findById(id) {
        const sql = 'SELECT * FROM users WHERE user_id = ?';
        return new Promise((resolve, reject) => {
            db.connection.execute(sql, [id], (err, results) => {
                if (err) reject(err);
                resolve(results[0] || null);
            });
        });
    }

    // Find all users (admin only — used in AdminDashboard)
    static findAllUsers() {
        const sql = 'SELECT user_id, username, email, role, created_at FROM users';
        return new Promise((resolve, reject) => {
            db.connection.execute(sql, [], (err, results) => {
                if (err) reject(err);
                resolve(results);
            });
        });
    }

    // Update user password by email
    static updatePassword(email, newPasswordHash) {
        const sql = 'UPDATE users SET password_hash = ? WHERE email = ?';
        return new Promise((resolve, reject) => {
            db.connection.execute(sql, [newPasswordHash, email], (err, result) => {
                if (err) reject(err);
                resolve(result.affectedRows > 0);
            });
        });
    }

    // Check if user is admin
    static isAdmin(user) {
        return user && user.role === 'admin';
    }
}

module.exports = UserModel;