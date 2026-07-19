    const express = require("express");
    const router = express.Router();

    const reservationController = require("../controllers/reservationController");

    const authMiddleware = require("../../../middleware/authMiddleware");
    const adminMiddleware = require("../../../middleware/adminMiddleware");

    // User
    router.post(
        "/book/:bookId",
        authMiddleware,
        reservationController.createReservation
    );

    router.get(
        "/my-reservations",
        authMiddleware,
        reservationController.myReservations
    );

    // Admin
    router.get(
        "/admin",
        authMiddleware,
        adminMiddleware,
        reservationController.adminReservations
    );

    router.post(
        "/:id/approve",
        authMiddleware,
        adminMiddleware,
        reservationController.approveReservation
    );

    router.post(
        "/:id/reject",
        authMiddleware,
        adminMiddleware,
        reservationController.rejectReservation
    );

    router.post(
        "/:id/delete",
        authMiddleware,
        adminMiddleware,
        reservationController.deleteReservation
    );

    module.exports = router;