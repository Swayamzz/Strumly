const express = require('express');
const router = express.Router();
const { protect } = require('../Middleware/auth');
const { mediaUpload, uploadMedia, getMyMedia, getUserMedia, deleteMedia } = require('../controllers/mediaController');

router.get('/my',              protect, getMyMedia);
router.get('/user/:userId',    getUserMedia);
router.post('/',               protect, mediaUpload.single('file'), uploadMedia);
router.delete('/:id',          protect, deleteMedia);

module.exports = router;
