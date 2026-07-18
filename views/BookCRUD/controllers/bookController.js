const path = require('path');
const Book = require('../models/bookModel');
const { generateBookQRCode } = require('../helpers/qrGenerator');

// Views live inside this feature folder, not the root views/ folder.
// path.join(__dirname, ...) gives Express an absolute path, so it
// renders correctly regardless of app.set('views') config in app.js.
const VIEWS = path.join(__dirname, '../views');

// LIST all books (admin view)
exports.listBooks = (req, res) => {
  Book.getAllBooks((err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render(path.join(VIEWS, 'list'), { books: results, user: req.session.user });
  });
};

// SHOW add book form
exports.showAddForm = (req, res) => {
  res.render(path.join(VIEWS, 'add'), { user: req.session.user });
};

// HANDLE add book
exports.addBook = (req, res) => {
  Book.createBook(req.body, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.redirect('/books');
  });
};

// SHOW edit book form
exports.showEditForm = (req, res) => {
  Book.getBookById(req.params.id, async (err, results) => {
    if (err || results.length === 0) {
      console.error(err);
      return res.status(404).send('Book not found');
    }
    const book = results[0];

    // Build the public lookup URL dynamically so it works correctly
    // whether you're on localhost or the deployed Render URL.
    const lookupUrl = `${req.protocol}://${req.get('host')}/books/view/${book.id}`;

    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await generateBookQRCode(lookupUrl);
    } catch (qrErr) {
      console.error('QR generation failed:', qrErr);
      // Non-fatal — edit page still works, just without the QR image.
    }

    res.render(path.join(VIEWS, 'edit'), { book, qrCodeDataUrl, lookupUrl, user: req.session.user });
  });
};

// HANDLE edit book
exports.updateBook = (req, res) => {
  Book.updateBook(req.params.id, req.body, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.redirect('/books');
  });
};

// DELETE book
exports.deleteBook = (req, res) => {
  Book.deleteBook(req.params.id, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.redirect('/books');
  });
};

// TOGGLE status (available <-> reserved)
// Note: once Min's reservation logic is merged, the reservation flow
// will likely flip this status automatically. This manual toggle stays
// useful for admin overrides (e.g. marking a lost/damaged book unavailable).
exports.toggleStatus = (req, res) => {
  Book.getBookById(req.params.id, (err, results) => {
    if (err || results.length === 0) {
      console.error(err);
      return res.status(404).send('Book not found');
    }
    const newStatus = results[0].status === 'available' ? 'reserved' : 'available';
    Book.updateStatus(req.params.id, newStatus, (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Database error');
      }
      res.redirect('/books');
    });
  });
};

// PUBLIC book lookup page — reached by scanning a book's QR code.
// Deliberately NOT behind requireAuth/requireAdmin: a patron holding
// the physical book should be able to scan it and see basic info
// without logging in. Only safe, public-facing fields are exposed here
// (title/author/genre/status) — no admin actions, no session data.
exports.viewPublicBook = (req, res) => {
  Book.getBookById(req.params.id, (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).render(path.join(VIEWS, 'public-not-found'));
    }
    res.render(path.join(VIEWS, 'public-view'), { book: results[0] });
  });
};
