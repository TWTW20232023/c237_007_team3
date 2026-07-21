const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../../../middleware/authMiddleware');
const adminMiddleware = require('../../../middleware/adminMiddleware');

// Admin overview - the only route still admin-only
router.get('/admin/all', authMiddleware, adminMiddleware, reviewController.showAdminReviews);

// Edit/delete - NOT admin-only anymore. Any logged-in user can reach
// these; the controller itself checks admin OR "is this your own review"
// and 403s otherwise. Still 2 path segments, so no collision with
// '/:bookId' below either way.
router.get('/:reviewId/edit', authMiddleware, reviewController.showEditReviewForm);
router.post('/:reviewId/edit', authMiddleware, reviewController.updateReview);
router.post('/:reviewId/delete', authMiddleware, reviewController.deleteReview);

// My Reviews - IMPORTANT: must come before the /:bookId routes below.
// '/my-reviews' is a single path segment, same shape as ':bookId', so if
// this were registered after, Express would treat "my-reviews" as if it
// were a book ID and never reach this handler at all.
router.get('/my-reviews', authMiddleware, reviewController.showMyReviews);
router.post('/my-reviews', authMiddleware, reviewController.submitMyReview);

// Public / user-facing
router.get('/:bookId', reviewController.showBookReviews);
router.post('/:bookId', authMiddleware, reviewController.submitReview);

module.exports = router;
