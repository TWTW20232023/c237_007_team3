const path = require('path');
const Catalog = require('../models/catalogModel');

// Absolute path so rendering works regardless of app.set('views') config -
// same pattern as bookController.js / uiController.js.
const VIEWS = path.join(__dirname, '../views');

// GET /catalog?genre=&author=&q=
exports.listCatalog = (req, res) => {
  const filters = {
    genre: (req.query.genre || '').trim(),
    author: (req.query.author || '').trim(),
    q: (req.query.q || '').trim(),
  };

  Catalog.getCatalog(filters, (err, books) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    Catalog.getGenres((genreErr, genres) => {
      if (genreErr) {
        console.error(genreErr);
        genres = [];
      }
      res.render(path.join(VIEWS, 'catalog'), {
        title: 'Book List',
        books,
        genres,
        filters,
      });
    });
  });
};
