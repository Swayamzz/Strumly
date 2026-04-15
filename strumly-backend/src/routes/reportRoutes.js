const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { reportUser, reportPost } = require('../controllers/reportController');

router.post('/user/:reportedId',  protect, reportUser);
router.post('/post/:postId',      protect, reportPost);

module.exports = router;
