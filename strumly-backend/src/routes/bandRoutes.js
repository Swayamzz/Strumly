const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const {
  bandUpload, getAllBands, getMyBands, getBandById, createBand, updateBand, deleteBand,
  sendJoinRequest, getJoinRequests, respondToRequest, removeMember, leaveBand,
  getMySentRequests, searchBands, inviteUser,
} = require('../controllers/bandController');

router.get('/my',                                protect, getMyBands);
router.get('/search',                            searchBands);
router.get('/requests/sent',                     protect, getMySentRequests);
router.get('/',                                  getAllBands);
router.post('/',                                 protect, bandUpload.single('profilePicture'), createBand);
router.get('/:id',                               getBandById);
router.put('/:id',                               protect, bandUpload.single('profilePicture'), updateBand);
router.delete('/:id',                            protect, deleteBand);
router.post('/:id/join',                         protect, sendJoinRequest);
router.get('/:id/requests',                      protect, getJoinRequests);
router.post('/:id/requests/:reqId/respond',      protect, respondToRequest);
router.delete('/:id/members/:userId',            protect, removeMember);
router.delete('/:id/leave',                      protect, leaveBand);
router.post('/:id/invite/:userId',               protect, inviteUser);

module.exports = router;
