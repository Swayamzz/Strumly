const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  searchUsers,
  getUserStats,
  searchByUsername,
} = require('../controllers/userController');

// Routes
router.get('/',              getAllUsers);
router.get('/search',        searchUsers);
router.get('/find',          searchByUsername);
router.get('/:id',           getUserById);
router.get('/:id/stats',     getUserStats);
router.post('/',             createUser);

module.exports = router;