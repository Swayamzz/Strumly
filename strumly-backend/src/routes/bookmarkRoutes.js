const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { toggleBookmark, getSavedPosts } = require('../controllers/bookmarkController');

router.get('/',               protect, getSavedPosts);
router.post('/:postId',       protect, toggleBookmark);

module.exports = router;
