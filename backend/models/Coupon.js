const mongoose = require('mongoose');

const usedBySchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  used_at: { type: Date, default: Date.now },
}, { _id: false });

const couponSchema = new mongoose.Schema({
  code:            { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
  description:     { type: String, default: '' },
  discount_type:   { type: String, enum: ['percentage', 'flat'], required: true },
  discount_value:  { type: Number, required: true, min: 0 },
  min_order_amount: { type: Number, default: 0 },
  max_discount:    { type: Number, default: 0 },
  usage_limit:     { type: Number, default: 100 },
  used_count:      { type: Number, default: 0 },
  per_user_limit:  { type: Number, default: 1 },
  valid_from:      { type: Date, required: true },
  valid_until:     { type: Date, required: true },
  is_active:       { type: Boolean, default: true },
  used_by:         [usedBySchema],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

module.exports = mongoose.model('Coupon', couponSchema);
