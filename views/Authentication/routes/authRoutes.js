const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
// ─── Sign Up ──────────────────────
router.get('/signup', AuthController.showSignUp);
router.post('/signup', AuthController.signUp);

// ─── Login ────────────────────────
router.get('/login', AuthController.showLogin);
router.post('/login', AuthController.login);

// ─── Logout ───────────────────────
router.get('/logout', AuthController.logout);

// ─── Admin Dashboard (redirect) ───
router.get('/dashboard', AuthController.showAdminDashboard);
    // ════════════════════════════════════════════
    //  Forgot Password & OTP Flow
    // ════════════════════════════════════════════

// ─── Forgot Password ──────────────
router.get('/forgot-password', AuthController.showForgotPassword);
router.post('/forgot-password', AuthController.forgotPassword);

// ─── Verify OTP ───────────────────
router.get('/verify-otp', AuthController.showVerifyOTP);
router.post('/verify-otp', AuthController.verifyOTP);

// ─── Reset Password ───────────────
router.get('/reset-password', AuthController.showResetPassword);
router.post('/reset-password', AuthController.resetPassword);

module.exports = router;

console.log("SUCCESS: The forgot-password route file is loaded!");
module.exports = router;