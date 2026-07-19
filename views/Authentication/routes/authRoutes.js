const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../../../middleware/authMiddleware');
const adminMiddleware = require('../../../middleware/adminMiddleware');

//  Public Routes 
router.get('/signup', authController.showSignUp);
router.post('/signup', authController.signUp);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

//  Protected Routes  in AND being an admin
router.get('/dashboard', authMiddleware, adminMiddleware, authController.showAdminDashboard);

module.exports = router;