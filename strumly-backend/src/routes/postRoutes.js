const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload, createPost, getFeed, getUserPosts, likePost, addComment, getComments, deletePost } = require('../controllers/postController');

router.get('/feed',              protect, getFeed);
router.post('/',                 protect, upload.single('media'), createPost);
router.get('/user/:userId',      protect, getUserPosts);
router.post('/:postId/like',     protect, likePost);
router.post('/:postId/comment',  protect, addComment);
router.get('/:postId/comments',  protect, getComments);
router.delete('/:postId',        protect, deletePost);

module.exports = router;
