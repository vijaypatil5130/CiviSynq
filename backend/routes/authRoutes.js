
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone) => {
  const cleaned = phone.replace(/[\s()-]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned);
};

// CITIZEN REGISTRATION
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, confirmPassword } = req.body;

    if (
      typeof fullName !== 'string' ||
      typeof email !== 'string' ||
      typeof phone !== 'string' ||
      typeof password !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      return res.status(400).json({
        message: 'Please provide valid registration details.'
      });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Please fill in all fields.'
      });
    }

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        message: 'Name must be between 2 and 60 characters.'
      });
    }

    if (!isValidEmail(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({
        message: 'Please enter a valid email address.'
      });
    }

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        message: 'Please enter a valid phone number.'
      });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        message: 'Password must contain between 8 and 128 characters.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match.'
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: 'citizen'
    });

    return res.status(201).json({
      message: 'Citizen account created successfully!',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.'
      });
    }

    console.error('Registration Error:', error.message);

    return res.status(500).json({
      message: 'Registration failed. Please try again.'
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Please enter your email and password.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isValidEmail(cleanEmail)) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
        algorithm: 'HS256'
      }
    );

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);

    return res.status(500).json({
      message: 'Login failed. Please try again.'
    });
  }
});

// GET CURRENT USER
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'Account not found.'
      });
    }

    return res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profile Fetch Error:', error.message);

    return res.status(500).json({
      message: 'Unable to load your profile.'
    });
  }
});

// UPDATE PROFILE
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    if (
      typeof fullName !== 'string' ||
      typeof phone !== 'string'
    ) {
      return res.status(400).json({
        message: 'Name and phone number are required.'
      });
    }

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        message: 'Name must be between 2 and 60 characters.'
      });
    }

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        message: 'Please enter a valid phone number.'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Account not found.'
      });
    }

    user.fullName = cleanName;
    user.phone = cleanPhone;

    await user.save();

    return res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Profile Update Error:', error.message);

    return res.status(500).json({
      message: 'Unable to update your profile.'
    });
  }
});

// CHANGE PASSWORD
router.patch('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmNewPassword !== 'string' ||
      !currentPassword ||
      !newPassword ||
      !confirmNewPassword
    ) {
      return res.status(400).json({
        message: 'Please fill in all password fields.'
      });
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({
        message: 'New password must contain between 8 and 128 characters.'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: 'New passwords do not match.'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Account not found.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Current password is incorrect.'
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      message: 'Password changed successfully!'
    });
  } catch (error) {
    console.error('Password Change Error:', error.message);

    return res.status(500).json({
      message: 'Unable to change password.'
    });
  }
});

module.exports = router;
