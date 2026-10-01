// routes/coupons.js — Coupon management & validation
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const Coupon = require('../models/Coupon');
const { createCouponSchema, validateCouponSchema } = require('../validators/coupon.validator');

const router = express.Router();

// POST /api/coupons — Create a coupon (admin only)
router.post(
  '/',
  authMiddleware,
  authorize('admin'),
  validate(createCouponSchema),
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ coupon });
  })
);

// GET /api/coupons — List all coupons with pagination (admin only)
router.get(
  '/',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(),
    ]);

    const pages = Math.ceil(total / limit);
    res.json({ coupons, page, pages, total });
  })
);

// GET /api/coupons/active — List active, valid coupons (public)
router.get(
  '/active',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const coupons = await Coupon.find({
      is_active: true,
      valid_until: { $gt: now },
    })
      .select('code description discount_type discount_value min_order_amount max_discount')
      .lean();

    res.json({ coupons });
  })
);

// PUT /api/coupons/:id — Update a coupon (admin only)
router.put(
  '/:id',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found');
    }
    res.json({ coupon });
  })
);

// DELETE /api/coupons/:id — Soft delete coupon (admin only)
router.delete(
  '/:id',
  authMiddleware,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { is_active: false },
      { new: true }
    );
    if (!coupon) {
      throw new ApiError(404, 'Coupon not found');
    }
    res.json({ message: 'Coupon deactivated successfully' });
  })
);

// POST /api/coupons/validate — Validate a coupon for the user (auth required)
router.post(
  '/validate',
  authMiddleware,
  validate(validateCouponSchema),
  asyncHandler(async (req, res) => {
    const { code, cart_total } = req.body;
    const now = new Date();

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), is_active: true });

    if (!coupon) {
      return res.json({ valid: false, discount: 0, message: 'Coupon not found' });
    }

    // Check validity period
    if (now < coupon.valid_from || now > coupon.valid_until) {
      return res.json({ valid: false, discount: 0, message: 'Coupon has expired or is not yet valid' });
    }

    // Check overall usage limit
    if (coupon.used_count >= coupon.usage_limit) {
      return res.json({ valid: false, discount: 0, message: 'Coupon usage limit reached' });
    }

    // Check per-user limit
    const userUsageCount = coupon.used_by.filter(
      (u) => u.user.toString() === req.user.id
    ).length;
    if (userUsageCount >= coupon.per_user_limit) {
      return res.json({ valid: false, discount: 0, message: 'You have already used this coupon' });
    }

    // Check minimum order amount
    if (cart_total < coupon.min_order_amount) {
      return res.json({
        valid: false,
        discount: 0,
        message: `Minimum order amount is ₹${coupon.min_order_amount}`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (cart_total * coupon.discount_value) / 100;
      if (coupon.max_discount > 0 && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else {
      discount = coupon.discount_value;
    }

    discount = Math.round(discount * 100) / 100;

    res.json({ valid: true, discount, message: 'Coupon applied successfully' });
  })
);

module.exports = router;
