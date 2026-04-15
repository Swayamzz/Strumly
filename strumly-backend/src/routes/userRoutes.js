const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../Middleware/auth');
const {
  getAllUsers, getUserById, createUser, searchUsers,
  getUserStats, searchByUsername, updateProfile, getMyProfile,
} = require('../controllers/userController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Routes
router.get('/',              getAllUsers);
router.get('/search',        searchUsers);
router.get('/find',          searchByUsername);
router.get('/me',            protect, getMyProfile);
router.patch('/me',          protect, upload.single('avatar'), updateProfile);
router.get('/:id',           getUserById);
router.get('/:id/stats',     getUserStats);
router.post('/',             createUser);

module.exports = router;