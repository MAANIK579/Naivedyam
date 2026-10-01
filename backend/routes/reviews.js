// routes/reviews.js — Reviews for menu items
const express = require('express');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const Review = require('../models/Review');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { reviewSchema } = require('../validators/review.validator');

const router = express.Router();

// POST /api/reviews — Submit a review (auth required)
router.post(
  '/',
  authMiddleware,
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    const { order_id, menu_item_id, menu_item, rating, comment, type } = req.body;

    if (!mongoose.Types.ObjectId.isValid(order_id)) {
      throw new ApiError(400, 'Invalid order id');
    }

    // Verify order exists and belongs to the user
    const order = await Order.findById(order_id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    if (order.user.toString() !== req.user.id) {
      throw new ApiError(403, 'This order does not belong to you');
    }
    if (order.status !== 'delivered') {
      throw new ApiError(400, 'You can only review delivered orders');
    }

    let resolvedMenuItemId = menu_item_id || menu_item;
    if (!resolvedMenuItemId && type === 'order') {
      resolvedMenuItemId = order.items?.[0]?.menu_item?.toString();
    }

    if (!resolvedMenuItemId) {
      throw new ApiError(400, 'menu_item_id is required');
    }

    if (!mongoose.Types.ObjectId.isValid(resolvedMenuItemId)) {
      throw new ApiError(400, 'Invalid menu item id');
    }

    const isItemInOrder = (order.items || []).some(
      (item) => item.menu_item && item.menu_item.toString() === resolvedMenuItemId.toString()
    );
    if (!isItemInOrder) {
      throw new ApiError(400, 'Selected item is not part of this order');
    }

    // Check for duplicate review (same user + order + menu_item)
    const existing = await Review.findOne({
      user: req.user.id,
      order: order_id,
      menu_item: resolvedMenuItemId,
    });
    if (existing) {
      throw new ApiError(400, 'You have already reviewed this item for this order');
    }

    // Verify the menu item exists
    const menuItem = await MenuItem.findById(resolvedMenuItemId);
    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    const review = await Review.create({
      user: req.user.id,
      order: order_id,
      menu_item: resolvedMenuItemId,
      rating,
      comment: comment || '',
    });

    res.status(201).json({ review });
  })
);

// GET /api/reviews/item/:itemId — Get reviews for a menu item (public)
router.get(
  '/item/:itemId',
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      throw new ApiError(400, 'Invalid menu item id');
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    // Fetch paginated reviews
    const [reviews, total] = await Promise.all([
      Review.find({ menu_item: itemId })
        .populate('user', 'name')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ menu_item: itemId }),
    ]);

    // Build summary with aggregation
    const summaryAgg = await Review.aggregate([
      { $match: { menu_item: itemObjectId } },
      {
        $group: {
          _id: null,
          avg_rating: { $avg: '$rating' },
          rating_count: { $sum: 1 },
        },
      },
    ]);

    // Rating distribution
    const distAgg = await Review.aggregate([
      { $match: { menu_item: itemObjectId } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const entry of distAgg) {
      distribution[entry._id] = entry.count;
    }

    const summary = {
      avg_rating: summaryAgg.length > 0 ? Math.round(summaryAgg[0].avg_rating * 10) / 10 : 0,
      rating_count: summaryAgg.length > 0 ? summaryAgg[0].rating_count : 0,
      distribution,
    };

    const pages = Math.ceil(total / limit);

    res.json({ reviews, summary, page, pages });
  })
);

// GET /api/reviews/my — List current user's reviews (auth required)
router.get(
  '/my',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const reviews = await Review.find({ user: req.user.id })
      .populate('menu_item', 'name emoji')
      .populate('order', 'display_id created_at status')
      .sort({ created_at: -1 })
      .lean();

    res.json({ reviews });
  })
);

module.exports = router;
