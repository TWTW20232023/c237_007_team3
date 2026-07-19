const db = require('../../../config/db');

// Read-only queries for the "My Reservations" page. Creating/updating
// reservations is Min's Reservation feature; approving them is Tristan's
// AdminDashboard. Uses db.connection.query(...) with callbacks, matching
// bookModel.js's actual convention - NOT db.query() directly (that
// doesn't exist - see Step 3) and NOT promises/async-await.

function getReservationsForUser(userId, callback) {
  const sql = `
    SELECT reservations.reservation_id, reservations.status,
           reservations.reserved_at, reservations.expires_at,
           books.title AS book_title, books.author AS book_author
    FROM reservations
    JOIN books ON books.id = reservations.book_id
    WHERE reservations.user_id = ?
    ORDER BY reservations.reserved_at DESC
  `;
  db.connection.query(sql, [userId], callback);
}

module.exports = { getReservationsForUser };
