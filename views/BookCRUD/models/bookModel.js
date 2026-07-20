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

// --- Cover image (book_images table) ---
// ON DUPLICATE KEY UPDATE handles both "first upload" and "replace
// existing image" with one query, since book_id is UNIQUE on that table.
function saveImage(bookId, imageBuffer, mimeType, callback) {
  const sql = `
    INSERT INTO book_images (book_id, image_data, mime_type)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE image_data = ?, mime_type = ?, uploaded_at = CURRENT_TIMESTAMP
  `;
  db.connection.query(sql, [bookId, imageBuffer, mimeType, imageBuffer, mimeType], callback);
}

function getImage(bookId, callback) {
  db.connection.query('SELECT image_data, mime_type FROM book_images WHERE book_id = ?', [bookId], callback);
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  updateStatus,
  saveImage,
  getImage
};
