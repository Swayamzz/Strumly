const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const {
  upload, getListings, getMyListings, getListingById,
  createListing, updateListing, deleteListing, updateStatus
} = require('../controllers/listingController');

router.get('/',              getListings);
router.get('/my',            protect, getMyListings);
router.get('/:id',           getListingById);
router.post('/',             protect, upload.array('images', 4), createListing);
router.put('/:id',           protect, updateListing);
router.delete('/:id',        protect, deleteListing);
router.patch('/:id/status',  protect, updateStatus);

module.exports = router;
