const Coupon = require('../models/Coupon');

/**
 * Validate a coupon code against business rules.
 * @param {string} code - Coupon code.
 * @param {string} userId - ID of the user trying to apply the coupon.
 * @param {number} cartTotal - Current cart total.
 * @returns {Promise<{ valid: boolean, discount: number, coupon_id?: string, message: string }>}
 */
async function validateCoupon(code, userId, cartTotal) {
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return { valid: false, discount: 0, message: 'Coupon not found' };
    }

    if (!coupon.is_active) {
      return { valid: false, discount: 0, message: 'Coupon is no longer active' };
    }

    const now = new Date();
    if (now < coupon.valid_from || now > coupon.valid_until) {
      return { valid: false, discount: 0, message: 'Coupon has expired or is not yet valid' };
    }

    if (coupon.used_count >= coupon.usage_limit) {
      return { valid: false, discount: 0, message: 'Coupon usage limit has been reached' };
    }

    // Check per-user limit
    const userUsageCount = coupon.used_by.filter(
      (entry) => entry.user.toString() === userId.toString()
    ).length;

    if (userUsageCount >= coupon.per_user_limit) {
      return { valid: false, discount: 0, message: 'You have already used this coupon the maximum number of times' };
    }

    if (cartTotal < coupon.min_order_amount) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order amount is Rs ${coupon.min_order_amount}`,
      };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'flat') {
      discount = coupon.discount_value;
    } else if (coupon.discount_type === 'percentage') {
      discount = (cartTotal * coupon.discount_value) / 100;
      const cap = coupon.max_discount || Infinity;
      discount = Math.min(discount, cap);
    }

    discount = Math.round(discount * 100) / 100;

    return {
      valid: true,
      discount,
      coupon_id: coupon._id,
      message: 'Coupon applied successfully',
    };
  } catch (err) {
    return { valid: false, discount: 0, message: 'Error validating coupon' };
  }
}

/**
 * Record that a coupon has been used by a user.
 * @param {string} couponId
 * @param {string} userId
 */
async function applyCouponUsage(couponId, userId) {
  return await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      $expr: { $lt: ['$used_count', '$usage_limit'] },
    },
    {
      $inc: { used_count: 1 },
      $push: { used_by: { user: userId, used_at: new Date() } },
    },
    { new: true }
  );
}

module.exports = { validateCoupon, applyCouponUsage };
