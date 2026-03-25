const express = require('express');
const router = express.Router();
const {
  getAllBands,
  createBand
} = require('../controllers/bandController');

// Routes
router.get('/', getAllBands);
router.post('/', createBand);

module.exports = router;