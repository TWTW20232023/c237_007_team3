const path = require('path');
const UserModel = require('../models/userModel');
const nodemailer = require('nodemailer');

// Absolute path so rendering works regardless of app.set('views') config -
// same pattern as bookController.js / catalogController.js.
const VIEWS = path.join(__dirname, '..');

class AuthController {

    // ─── Sign Up Page ──────────────────────
    static showSignUp(req, res) {
        res.render(path.join(VIEWS, 'signup'), {});
    }

    // ─── Handle Sign Up ────────────────────
    static signUp(req, res) {
        const { username, email, password, confirmPassword } = req.body;

        // Basic validation
        if (!username || !email || !password || !confirmPassword) {
            return res.render(path.join(VIEWS, 'signup'), {
                error: 'All fields are required.',
                oldInput: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.render(path.join(VIEWS, 'signup'), {
                error: 'Passwords do not match.',
                oldInput: req.body
            });
        }

        UserModel.createUser({ username, email, password })
    .then(() => {
        return res.redirect('/auth/login');
    })
            .then(() => {
                // After successful signup, redirect to login
                return res.redirect('/auth/login');
            })
            .catch((err) => {
                if (err.code === 'ER_DUP_ENTRY') {
                    const error = err.message.includes('email')
                        ? 'Email already exists.'
                        : 'Username already exists.';
                    return res.render(path.join(VIEWS, 'signup'), {
                        
                        error,
                        oldInput: req.body
                    });
                }
                console.error('Sign Up Error:', err);
                return res.render(path.join(VIEWS, 'signup'), {
                    error: 'An unexpected error occurred. Please try again.',
                    oldInput: req.body
                });
            });
    }

    // ─── Login Page ────────────────────────
    static showLogin(req, res) {
        res.render(path.join(VIEWS, 'login'), {});
    }

    // ─── Handle Login ──────────────────────
    static login(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render(path.join(VIEWS, 'login'), {
                error: 'Email and password are required.',
                oldInput: req.body
            });
        }

        UserModel.findByEmail(email)
            .then(async (user) => {
                if (!user) {
                    return res.render(path.join(VIEWS, 'login'), {
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
                    return res.render(path.join(VIEWS, 'login'), {
                        error: 'Invalid email or password.',
                        oldInput: req.body
                    });
                }
            })
            .catch((err) => {
                console.error('Login Error:', err);
                return res.render(path.join(VIEWS, 'login'), {
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
        res.render(path.join(VIEWS, 'forgot-password'), {});
    }

// ─── Handle Forgot Password (send OTP) ──
    static forgotPassword(req, res) {
        const { email } = req.body;

        if (!email) {
            return res.render(path.join(VIEWS, 'forgot-password'), {
                error: 'Email is required.',
                oldInput: req.body
            });
        }

        UserModel.findByEmail(email)
            // ⚠️ ADD 'async' HERE:
            .then(async (user) => { 
                if (!user) {
                    return res.render(path.join(VIEWS, 'forgot-password'), {
                        message: 'If an account with that email exists, an OTP has been sent.',
                        oldInput: req.body
                    });
                }

                // Generate a 6-digit OTP
                const otp = Math.floor(100000 + Math.random() * 900000).toString();

                req.session.resetOtp = {
                    code: otp,
                    email: user.email,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes expiry
                };

                // 👇 PASTE THE NEW MAILER CODE HERE 👇
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: user.email,
                    subject: 'Your Password Reset OTP',
                    text: `Your OTP for resetting your password is: ${otp}. It expires in 15 minutes.`
                };

                await transporter.sendMail(mailOptions);
                
                return res.redirect('/auth/verify-otp');
                // 👆 END OF NEW MAILER CODE 👆
            })
            .catch((err) => {
                console.error('Forgot Password Error:', err);
                
                return res.render(path.join(VIEWS, 'forgot-password'), {
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
        res.render(path.join(VIEWS, 'verify-otp'), {});
    }

    // ─── Handle OTP Verification ────────────
    static verifyOTP(req, res) {
        const { otp } = req.body;

        if (!otp) {
            return res.render(path.join(VIEWS, 'verify-otp'), {
                error: 'OTP is required.',
                oldInput: req.body
            });
        }

        // Check if OTP exists and hasn't expired
        if (!req.session.resetOtp || Date.now() > req.session.resetOtp.expiresAt) {
            return res.render(path.join(VIEWS, 'verify-otp'), {
                error: 'OTP has expired. Please request a new one.',
                oldInput: req.body
            });
        }

        if (otp !== req.session.resetOtp.code) {
            return res.render(path.join(VIEWS, 'verify-otp'), {
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
        res.render(path.join(VIEWS, 'reset-password'), { email });
    }

    // ─── Handle Reset Password ──────────────
    static resetPassword(req, res) {
        const { email, password, confirmPassword } = req.body;

        if (!email || !password || !confirmPassword) {
            return res.render(path.join(VIEWS, 'reset-password'), {
                error: 'All fields are required.',
                oldInput: req.body
            });
        }

        if (password !== confirmPassword) {
            return res.render(path.join(VIEWS, 'reset-password'), {
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

                // Change user.user_id to user.email
                await UserModel.updatePassword(user.email, hashedPassword);

                return res.render(path.join(VIEWS, 'reset-success'), {});
            })
            .catch((err) => {
                console.error('Reset Password Error:', err);
                return res.render(path.join(VIEWS, 'reset-password'), {
                    error: 'An unexpected error occurred. Please try again.',
                    oldInput: req.body
                });
            });
    }
}

module.exports = AuthController;