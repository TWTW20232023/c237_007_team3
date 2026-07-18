const UserModel = require('../models/userModel');

class AuthController {

    // ─── Sign Up Page ──────────────────────
    static showSignUp(req, res) {
        res.render('Authentication/views/signup', {});
    }

    // ─── Handle Sign Up ────────────────────
    static signUp(req, res) {
        const { username, email, password, confirmPassword } = req.body;

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            return res.render('Authentication/views/signup', {
                error: 'All fields are required.',
                oldInput: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.render('Authentication/views/signup', {
                error: 'Passwords do not match.',
                oldInput: req.body
            });
        }

        UserModel.createUser({ username, email, password })()
            .then(() => {
                // After successful signup, redirect to login
                return res.redirect('/auth/login');
            })
            .catch((err) => {
                if (err.code === 'ER_DUP_ENTRY') {
                    const error = err.message.includes('email')
                        ? 'Email already exists.'
                        : 'Username already exists.';
                    return res.render('Authentication/views/signup', {
                        error,
                        oldInput: req.body
                    });
                }
                console.error('Sign Up Error:', err);
                return res.render('Authentication/views/signup', {
                    error: 'An unexpected error occurred. Please try again.',
                    oldInput: req.body
                });
            });
    }

    // ─── Login Page ────────────────────────
    static showLogin(req, res) {
        res.render('Authentication/views/login', {});
    }

    // ─── Handle Login ──────────────────────
    static login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('Authentication/views/login', {
                error: 'Email and password are required.',
                oldInput: req.body
            });
        }

        UserModel.findByEmail(email)
            .then(async (user) => {
                if (!user) {
                    return res.render('Authentication/views/login', {
                        error: 'Invalid email or password.',
                        oldInput: req.body
                    });
                }

                const isMatch = await UserModel.verifyPassword(password, user.password_hash);

                if (isMatch) {
                    // Set session variables
                    req.session.user_id = user.user_id;
                    req.session.username = user.username;
                    req.session.email = user.email;
                    req.session.role = user.role;

                    // If admin, go to dashboard, else home
                    if (user.role === 'admin') {
                        return res.redirect('/auth/dashboard');
                    }
                    return res.redirect('/');
                } else {
                    return res.render('Authentication/views/login', {
                        error: 'Invalid email or password.',
                        oldInput: req.body
                    });
                }
            })
            .catch((err) => {
                console.error('Login Error:', err);
                return res.render('Authentication/views/login', {
                    error: 'An unexpected error occurred. Please try again.',
                    oldInput: req.body
                });
            });
    }

    // ─── Logout ──────────────────────────────
    static logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout Error:', err);
            }
            return res.redirect('/auth/login');
        });
    }

    // ─── Admin Dashboard Page ──────────────
    // Redirects to the real AdminDashboard feature (see app.js's /admin
    // route) instead of rendering its own separate page - there should
    // only be one admin dashboard, not two.
    static showAdminDashboard(req, res) {
        res.redirect('/admin');
    }
}

module.exports = AuthController;