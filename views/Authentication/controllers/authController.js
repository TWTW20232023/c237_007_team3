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
    static showAdminDashboard(req, res) {
        res.redirect('/admin');
    }

    // ════════════════════════════════════════════
    //  Forgot Password & OTP Flow
    // ════════════════════════════════════════════

    // ─── Show Forgot Password Page ──────────
    static showForgotPassword(req, res) {
        res.render('Authentication/views/forgot-password', {});
    }

    // ─── Handle Forgot Password (send OTP) ──
    static forgotPassword(req, res) {
        const { email } = req.body;

        if (!email) {
            return res.render('Authentication/views/forgot-password', {
                error: 'Email is required.',
                oldInput: req.body
            });
        }

        UserModel.findByEmail(email)
            .then((user) => {
                if (!user) {
                    // Don't reveal whether the email exists for security
                    return res.render('Authentication/views/forgot-password', {
                        message: 'If an account with that email exists, an OTP has been sent.',
                        oldInput: req.body
                    });
                }

                // Generate a 6-digit OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();

                // Store OTP in session (in production, use Redis or DB)
                req.session.resetOtp = {
                    code: otp,
                    email: user.email,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes expiry
                };

                // TODO: Send OTP via email (e.g., using Nodemailer)
                console.log(`OTP for ${email}: ${otp}`);

                return res.redirect('/auth/verify-otp');
            })
            .catch((err) => {
                console.error('Forgot Password Error:', err);
                return res.render('Authentication/views/forgot-password', {
                    error: 'An unexpected error occurred. Please try again.',
                    oldInput: req.body
                });
            });
    }

    // ─── Show Verify OTP Page ──────────────
    static showVerifyOTP(req, res) {
        if (!req.session.resetOtp) {
            return res.redirect('/auth/forgot-password');
        }
        res.render('Authentication/views/verify-otp', {});
    }

    // ─── Handle OTP Verification ────────────
    static verifyOTP(req, res) {
        const { otp } = req.body;

        if (!otp) {
            return res.render('Authentication/views/verify-otp', {
                error: 'OTP is required.',
                oldInput: req.body
            });
        }

        // Check if OTP exists and hasn't expired
        if (!req.session.resetOtp || Date.now() > req.session.resetOtp.expiresAt) {
            return res.render('Authentication/views/verify-otp', {
                error: 'OTP has expired. Please request a new one.',
                oldInput: req.body
            });
        }

        if (otp !== req.session.resetOtp.code) {
            return res.render('Authentication/views/verify-otp', {
                error: 'Invalid OTP. Please try again.',
                oldInput: req.body
            });
        }

        // Clear the OTP from session after successful verification
        const email = req.session.resetOtp.email;
        delete req.session.resetOtp;

        return res.redirect(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    }

    // ─── Show Reset Password Page ───────────
    static showResetPassword(req, res) {
        const email = req.query.email;
        if (!email) {
            return res.redirect('/auth/forgot-password');
        }
        res.render('Authentication/views/reset-password', { email });
    }

    // ─── Handle Reset Password ──────────────
    static resetPassword(req, res) {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.render('Authentication/views/reset-password', {
                error: 'All fields are required.',
                oldInput: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.render('Authentication/views/reset-password', {
                error: 'Passwords do not match.',
                oldInput: req.body
            });
        }

        UserModel.findByEmail(email)
            .then(async (user) => {
                if (!user) {
                    return res.redirect('/auth/forgot-password');
                }

                const hashedPassword = await UserModel.hashPassword(password);

                // Update password in DB — adjust column name as needed
                await UserModel.updatePassword(user.user_id, hashedPassword);

                return res.render('Authentication/views/reset-success', {});
            })
            .catch((err) => {
                console.error('Reset Password Error:', err);
                return res.render('Authentication/views/reset-password', {
                    error: 'An unexpected error occurred. Please try again.',
                    oldInput: req.body
                });
            });
    }
}

module.exports = AuthController;