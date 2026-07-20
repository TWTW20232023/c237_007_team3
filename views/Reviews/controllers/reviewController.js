const path = require('path');
const Review = require('../models/reviewModel');

const VIEWS = path.join(__dirname, '../views');

// GET /reviews/:bookId - public, shows every review immediately, no gate
exports.showBookReviews = (req, res) => {
  const bookId = req.params.bookId;

  Review.getBookWithReviews(bookId, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (!data.book) {
      return res.status(404).render('error', { title: 'Not found', message: "That book doesn't exist." });
    }

    if (req.session && req.session.user_id) {
      Review.hasUserReservedBook(req.session.user_id, bookId, (err2, hasReserved) => {
        if (err2) {
          console.error(err2);
          return res.status(500).send('Database error');
        }
        res.render(path.join(VIEWS, 'book-reviews'), { ...data, hasReserved, currentUserId: req.session.user_id });
      });
    } else {
      res.render(path.join(VIEWS, 'book-reviews'), { ...data, hasReserved: false, currentUserId: null });
    }
  });
};

// POST /reviews/:bookId - must be logged in AND have reserved this book.
// Shows up immediately on the book's page once submitted.
exports.submitReview = (req, res) => {
  const bookId = req.params.bookId;
  submitReviewCommon(req, res, bookId, `/reviews/${bookId}`);
};

// GET /reviews/my-reviews - the user's own review history + a form to
// submit a new one, picking from books they're eligible to review.
exports.showMyReviews = (req, res) => {
  const userId = req.session.user_id;

  Review.getReviewsByUser(userId, (err, myReviews) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    Review.getReservedBooksForUser(userId, (err2, eligibleBooks) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Database error');
      }
      res.render(path.join(VIEWS, 'my-reviews'), { myReviews, eligibleBooks });
    });
  });
};

// POST /reviews/my-reviews - same as submitReview, but the book comes
// from a dropdown in the request body instead of the URL.
exports.submitMyReview = (req, res) => {
  const bookId = req.body.bookId;
  submitReviewCommon(req, res, bookId, '/reviews/my-reviews');
};

function submitReviewCommon(req, res, bookId, redirectTo) {
  const userId = req.session.user_id;
  const rating = parseInt(req.body.rating, 10);
  const comment = req.body.comment;

  if (!bookId || !rating || rating < 1 || rating > 5) {
    return res.redirect(redirectTo);
  }

  Review.hasUserReservedBook(userId, bookId, (err, hasReserved) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (!hasReserved) {
      return res.status(403).render('error', {
        title: 'Cannot review this book',
        message: 'You can only review books you have reserved.',
      });
    }

    Review.createReview({ userId, bookId, rating, comment }, (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Database error');
      }
      res.redirect(redirectTo);
    });
  });
}

// GET /reviews/admin/all - admin's overview of every review, for
// after-the-fact moderation (edit/delete anything).
exports.showAdminReviews = (req, res) => {
  Review.getAllReviewsForAdmin((err, allReviews) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render(path.join(VIEWS, 'admin-reviews'), { allReviews });
  });
};

// --- Edit / delete - shared between admin and a review's own author ---
// Not route-gated to admin only anymore. Each handler checks: either
// you're an admin, or this review is yours - otherwise 403.

exports.showEditReviewForm = (req, res) => {
  Review.getReviewById(req.params.reviewId, (err, review) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (!review) {
      return res.status(404).render('error', { title: 'Not found', message: "That review doesn't exist." });
    }
    if (!canModify(req, review)) {
      return res.status(403).render('error', { title: 'Not allowed', message: 'You can only edit your own reviews.' });
    }
    res.render(path.join(VIEWS, 'edit-review'), { review, isAdmin: req.session.role === 'admin' });
  });
};

exports.updateReview = (req, res) => {
  const reviewId = req.params.reviewId;
  const rating = parseInt(req.body.rating, 10);
  const comment = req.body.comment;

  Review.getReviewById(reviewId, (err, review) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (!review) {
      return res.status(404).render('error', { title: 'Not found', message: "That review doesn't exist." });
    }
    if (!canModify(req, review)) {
      return res.status(403).render('error', { title: 'Not allowed', message: 'You can only edit your own reviews.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.redirect(`/reviews/${reviewId}/edit`);
    }

    Review.updateReview(reviewId, { rating, comment }, (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Database error');
      }
      res.redirect(redirectAfterModify(req));
    });
  });
};

exports.deleteReview = (req, res) => {
  const reviewId = req.params.reviewId;

  Review.getReviewById(reviewId, (err, review) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    if (!review) {
      return res.status(404).render('error', { title: 'Not found', message: "That review doesn't exist." });
    }
    if (!canModify(req, review)) {
      return res.status(403).render('error', { title: 'Not allowed', message: 'You can only delete your own reviews.' });
    }

    Review.deleteReview(reviewId, (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).send('Database error');
      }
      res.redirect(redirectAfterModify(req));
    });
  });
};

// Admin can modify anything; a regular user can only modify their own review.
function canModify(req, review) {
  return req.session.role === 'admin' || review.user_id === req.session.user_id;
}

// Admins land back on the admin overview; regular users land back on
// their own My Reviews page - sending an admin to /my-reviews or a
// regular user to /admin/all (which they can't even access) would be wrong.
function redirectAfterModify(req) {
  return req.session.role === 'admin' ? '/reviews/admin/all' : '/reviews/my-reviews';
}
