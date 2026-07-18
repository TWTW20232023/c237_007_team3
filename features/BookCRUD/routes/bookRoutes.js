const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { requireAuth } = require('../../../middleware/auth');
const { requireAdmin } = require('../../../middleware/admin');

router.get('/', requireAuth, requireAdmin, bookController.listBooks);
router.get('/add', requireAuth, requireAdmin, bookController.showAddForm);
router.post('/add', requireAuth, requireAdmin, bookController.addBook);
router.get('/edit/:id', requireAuth, requireAdmin, bookController.showEditForm);
router.post('/edit/:id', requireAuth, requireAdmin, bookController.updateBook);
router.post('/delete/:id', requireAuth, requireAdmin, bookController.deleteBook);
router.post('/toggle/:id', requireAuth, requireAdmin, bookController.toggleStatus);

// PUBLIC route — no requireAuth/requireAdmin. Reached by scanning a
// book's QR code. Must be placed carefully: since it's just '/view/:id'
// (a distinct path from '/edit/:id' etc.), there's no route collision.
router.get('/view/:id', bookController.viewPublicBook);

module.exports = router;
