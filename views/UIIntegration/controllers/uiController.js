const path = require('path');
const Reservation = require('../models/reservationModel');

// Absolute path so rendering works regardless of app.set('views') config -
// same pattern as bookController.js.
const VIEWS = path.join(__dirname, '../views');

const EXPIRING_SOON_DAYS = 2;

// GET /dashboard
exports.showDashboard = (req, res) => {
  Reservation.getReservationsForUser(req.session.user_id, (err, results) => {
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
    // EXPIRING_SOON_DAYS left before expires_at.
    const now = new Date();
    const expiringSoon = results.filter((r) => {
      if (r.status === 'expired') return false;
      const daysLeft = (new Date(r.expires_at) - now) / (1000 * 60 * 60 * 24);
      return daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;
    });

    res.render(path.join(VIEWS, 'dashboard'), { stats, expiringSoon });
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
