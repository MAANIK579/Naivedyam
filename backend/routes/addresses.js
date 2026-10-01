// routes/addresses.js — User address management
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// All address routes require authentication
router.use(authMiddleware);

// GET /api/addresses — List user's addresses
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.json({ addresses: user.addresses });
  })
);

// POST /api/addresses — Add a new address
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const { label, full_address, landmark, lat, lng, is_default } = req.body;

    if (!full_address) {
      throw new ApiError(400, 'full_address is required');
    }

    // If new address is default, unset all others
    if (is_default) {
      for (const addr of user.addresses) {
        addr.is_default = false;
      }
    }

    const newAddress = {
      label: label || 'Home',
      full_address,
      landmark: landmark || '',
      lat: lat || 0,
      lng: lng || 0,
      is_default: is_default || false,
    };

    user.addresses.push(newAddress);
    await user.save();

    // Return the newly added address (last in the array)
    const address = user.addresses[user.addresses.length - 1];
    res.status(201).json({ address });
  })
);

// PUT /api/addresses/:id — Update an address
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    const { label, full_address, landmark, lat, lng, is_default } = req.body;

    if (label !== undefined) address.label = label;
    if (full_address !== undefined) address.full_address = full_address;
    if (landmark !== undefined) address.landmark = landmark;
    if (lat !== undefined) address.lat = lat;
    if (lng !== undefined) address.lng = lng;

    if (is_default) {
      for (const addr of user.addresses) {
        addr.is_default = false;
      }
      address.is_default = true;
    } else if (is_default === false) {
      address.is_default = false;
    }

    await user.save();
    res.json({ address });
  })
);

// DELETE /api/addresses/:id — Remove an address
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    address.deleteOne();
    await user.save();

    res.json({ message: 'Address removed successfully' });
  })
);

// PATCH /api/addresses/:id/default — Set an address as default
router.patch(
  '/:id/default',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const address = user.addresses.id(req.params.id);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }

    // Set all addresses to non-default
    for (const addr of user.addresses) {
      addr.is_default = false;
    }
    // Set this one as default
    address.is_default = true;

    await user.save();
    res.json({ message: 'Default address updated successfully' });
  })
);

module.exports = router;
