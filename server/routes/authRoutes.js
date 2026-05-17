const express = require('express');
const {
  registerUser,
  loginUser,
  updateDisplayName,
  getUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', registerUser);
router.post('/login', loginUser);

// Private routes
router.put('/displayname', protect, updateDisplayName);
router.get('/profile', protect, getUserProfile);

module.exports = router;