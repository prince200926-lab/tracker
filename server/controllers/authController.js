const jwt = require('jsonwebtoken');
const User = require('../database/User');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      logger.warn('Registration attempt with missing fields');
      return res.status(400).json({ message: 'Please include all fields' });
    }

    // Check if user already exists
    const userExists = await User.findByEmailOrUsername(email, username);

    if (userExists) {
      logger.warn(`Registration failed: User already exists (${email} or ${username})`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      userId: `user_${Date.now()}`,
      username,
      email,
      password,
      displayName: username // Will be updated after first login
    });

    if (user) {
      logger.info(`New user registered: ${user.username} (${user.email})`);

      // Parse joinedGroups from JSON string
      let joinedGroups = [];
      if (user.joinedGroups) {
        try {
          joinedGroups = JSON.parse(user.joinedGroups);
        } catch (e) {
          joinedGroups = [];
        }
      }

      res.status(201).json({
        _id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        joinedGroups: joinedGroups,
        token: generateToken(user.id),
        needsDisplayName: true // Flag to indicate user needs to set display name
      });
    } else {
      logger.error('Invalid user data');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      logger.warn('Login attempt with missing fields');
      return res.status(400).json({ message: 'Please include all fields' });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (user && (await User.comparePassword(password, user.password))) {
      logger.info(`User logged in: ${user.username} (${user.email})`);

      // Parse joinedGroups from JSON string
      let joinedGroups = [];
      if (user.joinedGroups) {
        try {
          joinedGroups = JSON.parse(user.joinedGroups);
        } catch (e) {
          joinedGroups = [];
        }
      }

      res.json({
        _id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        joinedGroups: joinedGroups,
        token: generateToken(user.id),
        needsDisplayName: !user.displayName || user.displayName === user.username
      });
    } else {
      logger.warn(`Invalid login attempt for: ${email}`);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user display name
// @route   PUT /api/auth/displayname
// @access  Private
const updateDisplayName = async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName) {
      logger.warn('Display name update attempt with missing field');
      return res.status(400).json({ message: 'Display name is required' });
    }

    const user = await User.update(req.user.userId, { displayName });

    if (user) {
      logger.info(`User ${user.username} updated display name to: ${displayName}`);

      // Parse joinedGroups from JSON string
      let joinedGroups = [];
      if (user.joinedGroups) {
        try {
          joinedGroups = JSON.parse(user.joinedGroups);
        } catch (e) {
          joinedGroups = [];
        }
      }

      res.json({
        _id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        joinedGroups: joinedGroups,
        token: generateToken(user.id)
      });
    } else {
      logger.error('User not found for display name update');
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    logger.error(`Display name update error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByUserId(req.user.userId);

    if (user) {
      logger.info(`Profile retrieved for user: ${user.username}`);

      // Parse joinedGroups from JSON string
      let joinedGroups = [];
      if (user.joinedGroups) {
        try {
          joinedGroups = JSON.parse(user.joinedGroups);
        } catch (e) {
          joinedGroups = [];
        }
      }

      res.json({
        _id: user.id,
        userId: user.userId,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        joinedGroups: joinedGroups
      });
    } else {
      logger.error('User not found when retrieving profile');
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    logger.error(`Profile retrieval error: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateDisplayName,
  getUserProfile
};