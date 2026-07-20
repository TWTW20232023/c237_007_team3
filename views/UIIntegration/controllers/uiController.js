const path = require('path');
const Reservation = require('../models/reservationModel');

// Absolute path so rendering works regardless of app.set('views') config -
// same pattern as bookController.js.
const VIEWS = path.join(__dirname, '../views');

const EXPIRING_SOON_DAYS = 2;
const RECOMMENDATION_LIMIT = 4;

// GET /dashboard
exports.showDashboard = (req, res) => {
  const userId = req.session.user_id;

  Reservation.getReservationsForUser(userId, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    const stats = {
      pending: results.filter((r) => r.status === 'pending').length,
      confirmed: results.filter((r) => r.status === 'confirmed').length,
      expired: results.filter((r) => r.status === 'expired').length,
      total: results.length,
    };

    // Anything still active (pending/confirmed) with less than
    // EXPIRING_SOON_DAYS left before expiry_date.
    const now = new Date();
    const expiringSoon = results.filter((r) => {
      if (r.status === 'expired' || r.status === 'overdue') return false;
      const daysLeft = (new Date(r.expiry_date) - now) / (1000 * 60 * 60 * 24);
      return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
    });

    // Recommendations - popular books always shown (works for everyone,
    // even with zero history), genre-based ones only shown if the user
    // actually has reservation history to base them on.
    Reservation.getPopularBooks(RECOMMENDATION_LIMIT, (popErr, popularBooks) => {
      if (popErr) {
        console.error(popErr);
        popularBooks = []; // don't let a recommendation query break the whole dashboard
      }

      Reservation.getSimilarGenreBooks(userId, RECOMMENDATION_LIMIT, (simErr, similarBooks) => {
        if (simErr) {
          console.error(simErr);
          similarBooks = [];
        }

        res.render(path.join(VIEWS, 'dashboard'), {
          stats,
          expiringSoon,
          popularBooks,
          similarBooks,
        });
      });
    });
  });
};

// GET /my-reservations
exports.showMyReservations = (req, res) => {
  Reservation.getReservationsForUser(req.session.user_id, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render(path.join(VIEWS, 'my-reservations'), { reservations: results });
  });
};
