const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { forgotPassword, verifyOTP, resetPassword } = require('../controllers/passwordResetController');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  checkAvailability,
  deleteAccount
} = require('../controllers/authController');
const { protect } = require('../Middleware/auth');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => {
    if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/check-availability', checkAvailability);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, avatarUpload.single('profilePicture'), updateProfile);
router.put('/change-password', protect, changePassword);
router.delete('/account',      protect, deleteAccount);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp',      verifyOTP);
router.post('/reset-password',  resetPassword);

module.exports = router;