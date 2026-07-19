const db = require('../../../config/db');

// Read-only queries for the public/user-facing book catalog. Deliberately
// separate from BookCRUD/models/bookModel.js (admin CRUD) so that feature's
// files don't need to be touched at all.
//
// NOTE on filters: the `books` table currently has title/author/genre/isbn/
// status - there is no `publisher` column yet. Filtering is implemented for
// category (genre) and author. A publisher filter would need a schema change
// to BookCRUD's books table + its add/edit forms, which is out of scope here
// since we're not touching other features' code.

function getCatalog(filters, callback) {
  const clauses = ["1 = 1"];
  const params = [];

  if (filters.genre) {
    clauses.push('genre = ?');
    params.push(filters.genre);
  }
  if (filters.author) {
    clauses.push('author LIKE ?');
    params.push(`%${filters.author}%`);
  }
  if (filters.q) {
    clauses.push('(title LIKE ? OR author LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sql = `SELECT * FROM books WHERE ${clauses.join(' AND ')} ORDER BY title ASC`;
  db.connection.query(sql, params, callback);
}

function getGenres(callback) {
  db.connection.query(
    "SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND genre <> '' ORDER BY genre ASC",
    callback
  );
}

function getAuthors(callback) {
  db.connection.query(
    "SELECT DISTINCT author FROM books WHERE author IS NOT NULL AND author <> '' ORDER BY author ASC",
    callback
  );
}

module.exports = { getCatalog, getGenres, getAuthors };
