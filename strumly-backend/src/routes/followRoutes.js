
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const followController = require('../controllers/followController');

router.post('/:userId/follow',     protect, followController.sendFollowRequest);
router.post('/:userId/unfollow',   protect, followController.unfollow);
router.post('/:requestId/accept',  protect, followController.acceptRequest);
router.post('/:requestId/decline', protect, followController.declineRequest);
router.get('/requests/pending',    protect, followController.getPendingRequests);
router.get('/:userId/followers',   protect, followController.getFollowers);
router.get('/:userId/following',   protect, followController.getFollowing);
router.get('/:userId/status',      protect, followController.getFollowStatus);

module.exports = router;
