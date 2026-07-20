const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const authMiddleware = require('../../../middleware/authMiddleware');
const adminMiddleware = require('../../../middleware/adminMiddleware');

router.get('/', authMiddleware, adminMiddleware, bookController.listBooks);
router.get('/add', authMiddleware, adminMiddleware, bookController.showAddForm);
router.post('/add', authMiddleware, adminMiddleware, bookController.addBook);
router.get('/edit/:id', authMiddleware, adminMiddleware, bookController.showEditForm);
router.post('/edit/:id', authMiddleware, adminMiddleware, bookController.updateBook);
router.post('/delete/:id', authMiddleware, adminMiddleware, bookController.deleteBook);
router.post('/toggle/:id', authMiddleware, adminMiddleware, bookController.toggleStatus);

// PUBLIC route — no requireAuth/requireAdmin. Reached by scanning a
// book's QR code. Must be placed carefully: since it's just '/view/:id'
// (a distinct path from '/edit/:id' etc.), there's no route collision.
router.get('/view/:id', bookController.viewPublicBook);

module.exports = router;
