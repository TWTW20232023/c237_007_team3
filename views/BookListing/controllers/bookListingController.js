const path = require('path');
const Book = require('../models/bookListingModel');

const VIEWS = path.join(__dirname, '../views');

exports.listBooks = (req, res) => {
  const { title = '', genre = '', status = '' } = req.query;

  Book.getFilteredBooks({ title, genre, status }, (err, results) => {
    if (err) { console.error(err); return res.status(500).send('Database error'); }

    Book.getAllGenres((err2, genreResults) => {
      if (err2) { console.error(err2); return res.status(500).send('Database error'); }

      Book.getPopularBooks(6, (err3, popularBooks) => {
        if (err3) { console.error(err3); return res.status(500).send('Database error'); }

        const genres = genreResults.map((row) => row.genre);
        const statuses = ['available', 'reserved', 'processing'];

        res.render(path.join(VIEWS, 'booklist'), {
          books: results,
          genres,
          statuses,
          query: { title, genre, status },
          popularBooks,
        });
      });
    });
  });
};