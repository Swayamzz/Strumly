const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  searchUsers
} = require('../controllers/userController');

// Routes
router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.post('/', createUser);

module.exports = router;