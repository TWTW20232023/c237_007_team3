const express = require('express');
const router = express.Router();
const bookListingController = require('../controllers/bookListingController');
const authMiddleware = require('../../../middleware/authMiddleware');

// Any logged-in user can browse/search — no adminMiddleware here,
// unlike BookCRUD which is admin-only.
router.get('/', authMiddleware, bookListingController.listBooks);

module.exports = router;