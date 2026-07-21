const db = require('../../../config/db');

// Read-only queries for browsing/searching books.
// Kept separate from BookCRUD's model to avoid both of you editing
// the same file and causing merge conflicts.
function getFilteredBooks(filters, callback) {
  const { title = '', genre = '', status = '' } = filters;
  let sql = 'SELECT * FROM books WHERE title LIKE ?';
  const params = [`%${title}%`];

  if (genre) {
    sql += ' AND genre = ?';
    params.push(genre);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY id DESC';
  db.connection.query(sql, params, callback);
}

function getAllGenres(callback) {
  db.connection.query('SELECT DISTINCT genre FROM books', callback);
}

function getPopularBooks(limit, callback) {
  const sql = `
    SELECT b.id, b.title, b.author, b.genre, b.status,
           COUNT(r.id) AS reservation_count
    FROM books b
    LEFT JOIN reservations r ON r.book_id = b.id
    GROUP BY b.id, b.title, b.author, b.genre, b.status
    ORDER BY reservation_count DESC, b.title ASC
    LIMIT ?
  `;
  db.connection.query(sql, [limit], callback);
}

module.exports = {
  getFilteredBooks,
  getAllGenres,
};