const db = require('../../../config/db');

// Fetches one book plus ALL its reviews - shows immediately on submission,
// no approval gate. Average rating is computed from everything for the
// same reason.
function getBookWithReviews(bookId, callback) {
  db.connection.query('SELECT * FROM books WHERE id = ?', [bookId], (err, bookRows) => {
    if (err) return callback(err);
    if (!bookRows.length) return callback(null, { book: null, reviews: [], averageRating: null });

    const sql = `
      SELECT reviews.review_id, reviews.rating, reviews.comment, reviews.created_at,
             reviews.user_id, users.username
      FROM reviews
      JOIN users ON users.user_id = reviews.user_id
      WHERE reviews.book_id = ?
      ORDER BY reviews.created_at DESC
    `;
    db.connection.query(sql, [bookId], (err2, reviewRows) => {
      if (err2) return callback(err2);

      const averageRating = reviewRows.length
        ? reviewRows.reduce((sum, r) => sum + r.rating, 0) / reviewRows.length
        : null;

      callback(null, { book: bookRows[0], reviews: reviewRows, averageRating });
    });
  });
}

// A user can only review a book they've actually reserved at some point -
// any reservation status counts (pending/confirmed/expired/overdue), since
// all of those mean they genuinely interacted with the book, not just
// browsed past it.
function hasUserReservedBook(userId, bookId, callback) {
  db.connection.query(
    'SELECT 1 FROM reservations WHERE user_id = ? AND book_id = ? LIMIT 1',
    [userId, bookId],
    (err, rows) => {
      if (err) return callback(err);
      callback(null, rows.length > 0);
    }
  );
}

function createReview({ userId, bookId, rating, comment }, callback) {
  const sql = 'INSERT INTO reviews (user_id, book_id, rating, comment) VALUES (?, ?, ?, ?)';
  db.connection.query(sql, [userId, bookId, rating, comment], callback);
}

// All of a user's own reviews - their personal history, used on the My
// Reviews page alongside Edit/Delete for each one.
function getReviewsByUser(userId, callback) {
  const sql = `
    SELECT reviews.review_id, reviews.rating, reviews.comment, reviews.created_at,
           books.title AS book_title
    FROM reviews
    JOIN books ON books.id = reviews.book_id
    WHERE reviews.user_id = ?
    ORDER BY reviews.created_at DESC
  `;
  db.connection.query(sql, [userId], callback);
}

// Books this user is eligible to review (has reserved at least once) -
// used to populate the book picker on the My Reviews page.
function getReservedBooksForUser(userId, callback) {
  const sql = `
    SELECT DISTINCT books.id, books.title
    FROM reservations
    JOIN books ON books.id = reservations.book_id
    WHERE reservations.user_id = ?
    ORDER BY books.title ASC
  `;
  db.connection.query(sql, [userId], callback);
}

// --- Admin oversight ---
// No more approval gate - admin's role now is purely after-the-fact
// moderation (edit or delete anything), same power a review's own author
// has over their own review. Everyone sees the same full list.

function getAllReviewsForAdmin(callback) {
  const sql = `
    SELECT reviews.review_id, reviews.rating, reviews.comment, reviews.created_at,
           users.username, books.title AS book_title
    FROM reviews
    JOIN users ON users.user_id = reviews.user_id
    JOIN books ON books.id = reviews.book_id
    ORDER BY reviews.created_at DESC
  `;
  db.connection.query(sql, callback);
}

function getReviewById(reviewId, callback) {
  db.connection.query('SELECT * FROM reviews WHERE review_id = ?', [reviewId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0] || null);
  });
}

function updateReview(reviewId, { rating, comment }, callback) {
  db.connection.query(
    'UPDATE reviews SET rating = ?, comment = ? WHERE review_id = ?',
    [rating, comment, reviewId],
    callback
  );
}

function deleteReview(reviewId, callback) {
  db.connection.query('DELETE FROM reviews WHERE review_id = ?', [reviewId], callback);
}

module.exports = {
  getBookWithReviews,
  hasUserReservedBook,
  createReview,
  getReviewsByUser,
  getReservedBooksForUser,
  getAllReviewsForAdmin,
  getReviewById,
  updateReview,
  deleteReview
};
