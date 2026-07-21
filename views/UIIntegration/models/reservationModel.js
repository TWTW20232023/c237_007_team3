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

// Popular books - most-reserved titles across everyone, limited to ones
// actually available right now. Works even for a brand new user with no
// history, so this also doubles as the fallback when personalised
// recommendations have nothing to go on.
function getPopularBooks(limit, callback) {
  const sql = `
    SELECT books.id, books.title, books.author, books.genre,
           COUNT(reservations.id) AS reservation_count
    FROM books
    LEFT JOIN reservations ON reservations.book_id = books.id
    WHERE books.status = 'available'
    GROUP BY books.id
    ORDER BY reservation_count DESC, books.title ASC
    LIMIT ?
  `;
  db.connection.query(sql, [limit], callback);
}

// "Because you reserved similar books" - looks at genres from the user's
// own reservation history, then suggests other available titles in those
// same genres that they haven't already reserved.
function getSimilarGenreBooks(userId, limit, callback) {
  const genreSql = `
    SELECT DISTINCT books.genre
    FROM reservations
    JOIN books ON books.id = reservations.book_id
    WHERE reservations.user_id = ? AND books.genre IS NOT NULL AND books.genre <> ''
  `;

  db.connection.query(genreSql, [userId], (err, genreRows) => {
    if (err) return callback(err);

    const genres = genreRows.map((r) => r.genre);
    if (genres.length === 0) {
      // No history yet - nothing to base a genre match on.
      return callback(null, []);
    }

    const placeholders = genres.map(() => '?').join(', ');
    const sql = `
      SELECT books.id, books.title, books.author, books.genre
      FROM books
      WHERE books.genre IN (${placeholders})
        AND books.status = 'available'
        AND books.id NOT IN (
          SELECT book_id FROM reservations WHERE user_id = ?
        )
      ORDER BY books.title ASC
      LIMIT ?
    `;
    db.connection.query(sql, [...genres, userId, limit], callback);
  });
}

module.exports = {
  getReservationsForUser,
  getPopularBooks,
  getSimilarGenreBooks
};
