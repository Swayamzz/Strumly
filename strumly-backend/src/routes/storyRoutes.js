const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { upload, createStory, getStories, deleteStory, cleanExpiredStories } = require('../controllers/storyController');

router.get('/', protect, getStories);
router.post('/', protect, upload.single('media'), createStory);
router.delete('/:id', protect, deleteStory);
router.delete('/admin/cleanup', protect, cleanExpiredStories);

module.exports = router;
