// features/Reservation (Min)/routes/reservationRoutes.js
//
// Everything for the Reservation feature in one file: DB queries,
// expiry logic, request handlers, and the router itself.
//
// Paths are 3 levels up to reach the project root:
//   routes/ -> Reservation (Min)/ -> features/ -> root
const express = require('express');
const path = require('path');
const router = express.Router();

const db = require('../../../config/db');            // Xylon/shared mysql2 pool
const { requireAuth } = require('../../../middleware/auth'); // built by Xylon

// ------------------------------------------------------------------
// Helper: expiry date = reservation date + 14 days
// ------------------------------------------------------------------
function calculateExpiryDate(fromDate = new Date(), daysValid = 14) {
    const expiry = new Date(fromDate);
    expiry.setDate(expiry.getDate() + daysValid);
    return expiry;
}

// ------------------------------------------------------------------
// Auto-expire logic ("check-on-load" — no cron needed).
// Any reservation still 'pending'/'confirmed' past its expiry_date
// becomes 'expired', and its book goes back to 'available'.
// Exported so Tristan's AdminDashboard can reuse it — see bottom.
// ------------------------------------------------------------------
async function expireOldReservations() {
    const [expired] = await db.query(
        `SELECT reservation_id, book_id
         FROM reservations
         WHERE status IN ('pending', 'confirmed') AND expiry_date < NOW()`
    );
    if (expired.length === 0) return;

    const reservationIds = expired.map(r => r.reservation_id);
    const bookIds = expired.map(r => r.book_id);

    await db.query(`UPDATE reservations SET status = 'expired' WHERE reservation_id IN (?)`, [reservationIds]);
    await db.query(`UPDATE books SET status = 'available' WHERE id IN (?)`, [bookIds]);
}

// ------------------------------------------------------------------
// POST /reservations/:bookId — create a reservation
// ------------------------------------------------------------------
router.post('/reservations/:bookId', requireAuth, async (req, res) => {
    const userId = req.session.user.id;
    const bookId = req.params.bookId;

    try {
        await expireOldReservations();

        const [bookRows] = await db.query('SELECT * FROM books WHERE id = ?', [bookId]);
        const book = bookRows[0];
        if (!book) return res.status(404).send('Book not found');

        if (book.status !== 'available') {
            return res.status(400).render('error', {
                message: 'Sorry, this book is no longer available for reservation.'
            });
        }

        const [existing] = await db.query(
            `SELECT * FROM reservations
             WHERE user_id = ? AND book_id = ? AND status IN ('pending','confirmed')`,
            [userId, bookId]
        );
        if (existing.length > 0) {
            return res.status(400).render('error', {
                message: 'You already have an active reservation for this book.'
            });
        }

        const reservationDate = new Date();
        const expiryDate = calculateExpiryDate(reservationDate, 14);

        await db.query(
            `INSERT INTO reservations (user_id, book_id, reservation_date, expiry_date, status)
             VALUES (?, ?, ?, ?, 'pending')`,
            [userId, bookId, reservationDate, expiryDate]
        );

        // Book goes to 'processing' while it waits for admin approval
        await db.query(`UPDATE books SET status = 'processing' WHERE id = ?`, [bookId]);

        res.redirect('/reservations/my');

    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating reservation');
    }
});

// ------------------------------------------------------------------
// GET /reservations/my — logged-in user's own reservations
// ------------------------------------------------------------------
router.get('/reservations/my', requireAuth, async (req, res) => {
    const userId = req.session.user.id;

    try {
        await expireOldReservations();

        const [reservations] = await db.query(
            `SELECT r.reservation_id, r.reservation_date, r.expiry_date, r.status,
                    b.title, b.author, b.genre
             FROM reservations r
             JOIN books b ON r.book_id = b.id
             WHERE r.user_id = ?
             ORDER BY r.reservation_date DESC`,
            [userId]
        );

        // Explicit path so this doesn't depend on app.js's views config
        res.render(path.join(__dirname, '../views/my-reservations'), { reservations });

    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading your reservations');
    }
});

module.exports = router;
module.exports.expireOldReservations = expireOldReservations; // for Tristan's AdminDashboard

// ---------------------------------------------------------
// In the shared app.js, add:
//   app.use('/', require('./features/Reservation (Min)/routes/reservationRoutes'));
// ---------------------------------------------------------
