const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  menu_item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true, index: true },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, default: '', maxlength: 500 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

reviewSchema.index({ user: 1, order: 1, menu_item: 1 }, { unique: true });

reviewSchema.post('save', async function() {
  try {
    const MenuItem = mongoose.model('MenuItem');
    const stats = await this.constructor.aggregate([
      { $match: { menu_item: this.menu_item } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await MenuItem.findByIdAndUpdate(this.menu_item, {
        avg_rating: Math.round(stats[0].avg * 10) / 10,
        rating_count: stats[0].count,
      });
    }
  } catch (err) {
    console.error('Failed to update MenuItem review aggregate stats:', err.message);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
