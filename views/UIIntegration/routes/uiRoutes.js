const express = require('express');
const router = express.Router();
const uiController = require('../controllers/uiController');
const authMiddleware = require('../../../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, uiController.showDashboard);
router.get('/my-reservations', authMiddleware, uiController.showMyReservations);

module.exports = router;
