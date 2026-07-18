const db = require('../../../config/db');
const { generateISBN13 } = require('../helpers/isbnGenerator');

// All database queries for the `books` table live here.
// Controllers call these functions instead of writing SQL directly.

function getAllBooks(callback) {
  db.connection.query('SELECT * FROM books ORDER BY id DESC', callback);
}

function getBookById(id, callback) {
  db.connection.query('SELECT * FROM books WHERE id = ?', [id], callback);
}

function createBook(data, callback) {
  const { title, author, genre } = data;
  const isbn = generateISBN13(); // auto-generated, not user input
  const sql = 'INSERT INTO books (title, author, genre, isbn, status) VALUES (?, ?, ?, ?, ?)';
  db.connection.query(sql, [title, author, genre, isbn, 'available'], callback);
}

function updateBook(id, data, callback) {
  const { title, author, genre } = data;
  // isbn intentionally excluded — it's permanent once generated
  const sql = 'UPDATE books SET title = ?, author = ?, genre = ? WHERE id = ?';
  db.connection.query(sql, [title, author, genre, id], callback);
}

function deleteBook(id, callback) {
  db.connection.query('DELETE FROM books WHERE id = ?', [id], callback);
}

function updateStatus(id, newStatus, callback) {
  db.connection.query('UPDATE books SET status = ? WHERE id = ?', [newStatus, id], callback);
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateStatus
};
