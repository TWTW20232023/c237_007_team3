const UserModel = require('../models/userModel');

class AuthController {

    // ─── Sign Up Page ──────────────────────
    static showSignUp(req, res) {
        res.render('features/Authentication/views/signup', {});
    }

    // ─── Handle Sign Up ────────────────────
    static signUp(req, res) {
        const { username, email, password, confirmPassword } = req.body;

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            return res.render('features/Authentication/views/signup', {
                error: 'All fields are required.',
                oldInput: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.render('features/Authentication/views/signup', {
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
                    return res.render('features/Authentication/views/signup', {
                        error,
                        oldInput: req.body
                    });
                }
                console.error('Sign Up Error:', err);
                return res.render('features/Authentication/views/signup', {
                    error: 'An unexpected error occurred. Please try again.',
                    oldInput: req.body
                });
            });
    }

    // ─── Login Page ────────────────────────
    static showLogin(req, res) {
        res.render('features/Authentication/views/login', {});
    }

    // ─── Handle Login ──────────────────────
    static login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('features/Authentication/views/login', {
                error: 'Email and password are required.',
                oldInput: req.body
            });
        }

        UserModel.findByEmail(email)
            .then(async (user) => {
                if (!user) {
                    return res.render('features/Authentication/views/login', {
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
                    return res.render('features/Authentication/views/login', {
                        error: 'Invalid email or password.',
                        oldInput: req.body
                    });
                }
            })
            .catch((err) => {
                console.error('Login Error:', err);
                return res.render('features/Authentication/views/login', {
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
    static showAdminDashboard(req, res) {
        res.render('features/Authentication/views/dashboard', { user: req.session.username || 'User' });
    }
}

module.exports = AuthController;