// routes/favorites.js — User favorites management
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

// All favorites routes require authentication
router.use(authMiddleware);

// GET /api/favorites — List user's favorite menu items
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .populate('favorites')
      .select('favorites');

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ favorites: user.favorites });
  })
);

// POST /api/favorites/:itemId — Add a menu item to favorites
router.post(
  '/:itemId',
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    // Verify menu item exists
    const menuItem = await MenuItem.findById(itemId);
    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { favorites: itemId },
    });

    res.json({ message: 'Item added to favorites' });
  })
);

// DELETE /api/favorites/:itemId — Remove a menu item from favorites
router.delete(
  '/:itemId',
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { favorites: itemId },
    });

    res.json({ message: 'Item removed from favorites' });
  })
);

module.exports = router;
