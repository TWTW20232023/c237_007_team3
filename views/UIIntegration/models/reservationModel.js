const db = require('../../../config/db');

function getReservationsForUser(userId, callback) {
  const sql = `
    SELECT
      reservations.id AS id,
      reservations.status,
      reservations.reservation_date,
      reservations.expiry_date,
      books.title AS book_title,
      books.author AS book_author
    FROM reservations
    JOIN books ON books.id = reservations.book_id
    WHERE reservations.user_id = ?
    ORDER BY reservations.reservation_date DESC
  `;

  db.connection.query(sql, [userId], callback);
}

module.exports = {
  getReservationsForUser
};