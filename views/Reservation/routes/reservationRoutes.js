const express = require('express');
const router = express.Router();

const reservationController = require('../controllers/reservationController');

const requireAuth = (req, res, next) => {
    req.session.user = {
        id: 1,
        username: "TestUser",
        role: "user"
    };
    next();
};


// Create reservation
router.post('/book/:bookId', requireAuth, reservationController.createReservation);

// View reservations
router.get('/my-reservations', requireAuth, reservationController.getMyReservations);


module.exports = router;