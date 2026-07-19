const Reservation = require('../models/reservationModel');

// POST /reservations/book/:bookId
exports.createReservation = (req, res) => {
    const bookId = req.params.bookId;
    const userId = req.session.user_id;

    Reservation.createReservation(userId, bookId, (err, result) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Database error while making a reservation.');
            return res.redirect('/catalog');
        }

        if (result.notFound) {
            req.flash('error', 'Book not found.');
            return res.redirect('/catalog');
        }

        if (result.notAvailable) {
            req.flash('error', 'This book is currently unavailable.');
            return res.redirect('/catalog');
        }

        req.flash(
            'success',
            `Reservation created successfully! The reservation is pending admin approval. It expires in ${Reservation.RESERVATION_PERIOD_DAYS} days.`
        );

        return res.redirect('/reservations/my-reservations');
    });
};

// GET /reservations/my-reservations
exports.myReservations = (req, res) => {
    Reservation.getReservationsForUser(req.session.user_id, (err, reservations) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Unable to load your reservations.');
            return res.redirect('/catalog');
        }

        res.render('Reservation/views/my-reservations', {
            reservations
        });
    });
};

// GET /reservations/admin
exports.adminReservations = (req, res) => {
    Reservation.getAllReservations((err, reservations) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Unable to load reservations.');
            return res.redirect('/admin');
        }

        res.render('Reservation/views/admin-reservations', {
            reservations
        });
    });
};

// POST /reservations/:id/approve
exports.approveReservation = (req, res) => {
    Reservation.approveReservation(req.params.id, (err) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Unable to approve reservation.');
            return res.redirect('/admin');
        }

        req.flash('success', 'Reservation approved successfully.');
        res.redirect('/admin');
    });
};

// POST /reservations/:id/reject
exports.rejectReservation = (req, res) => {
    Reservation.rejectReservation(req.params.id, (err) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Unable to reject reservation.');
            return res.redirect('/admin');
        }

        req.flash('success', 'Reservation rejected.');
        res.redirect('/admin');
    });
};

// POST /reservations/:id/delete
exports.deleteReservation = (req, res) => {
    Reservation.deleteReservation(req.params.id, (err) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Unable to delete reservation.');
            return res.redirect('/admin');
        }

        req.flash('success', 'Reservation deleted successfully.');
        res.redirect('/admin');
    });
};