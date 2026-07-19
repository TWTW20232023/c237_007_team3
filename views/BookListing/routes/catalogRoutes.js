const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

// Public book catalog - browsing doesn't require login, only reserving does
// (enforced in the Reservation feature's own route).
router.get('/', catalogController.listCatalog);

module.exports = router;
