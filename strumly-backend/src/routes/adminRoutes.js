const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../Middleware/auth');
const admin = require('../controllers/adminController');

// All admin routes require authentication + ADMIN role
router.use(protect, authorize('ADMIN'));

router.get('/dashboard',          admin.getDashboardStats);
router.get('/users',              admin.getUsers);
router.patch('/users/:id/role',   admin.updateUserRole);
router.delete('/users/:id',       admin.deleteUser);
router.get('/posts',              admin.getPosts);
router.delete('/posts/:id',       admin.deletePost);
router.get('/bands',              admin.getBands);
router.delete('/bands/:id',       admin.deleteBand);
router.get('/follow-requests',    admin.getPendingFollows);
router.get('/analytics',          admin.getAnalytics);

module.exports = router;
