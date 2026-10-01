// routes/auth.js — Register, Login & Profile (MongoDB/Mongoose)
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, phone, password, address, email } = req.body;

    const existing = await User.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      password,
      email: email || '',
      addresses: address ? [{ full_address: address, label: 'Home', is_default: true }] : [],
    });

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn || '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      },
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone: phone.trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid phone or password' });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, phone: user.phone, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn || '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
      },
    });
  })
);

// GET /api/auth/me  (protected)
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  })
);

// PUT /api/auth/me  (protected) — update name
router.put(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    const update = {};
    if (name) update.name = name.trim();

    await User.findByIdAndUpdate(req.user.id, update);
    res.json({ message: 'Profile updated' });
  })
);

// PUT /api/auth/me/push-token  (protected) — save push notification token
router.put(
  '/me/push-token',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { push_token } = req.body;
    await User.findByIdAndUpdate(req.user.id, { push_token: push_token || '' });
    res.json({ message: 'Push token saved' });
  })
);

module.exports = router;
