const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  price:         { type: Number, required: true, min: 0 },
  category:      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  emoji:         { type: String, default: '🍽️' },
  image_url:     { type: String, default: '' },
  is_veg:        { type: Boolean, default: true },
  is_available:  { type: Boolean, default: true },
  cuisine_type:  {
    type: String,
    enum: ['haryanvi', 'north_indian', 'mughlai', 'street_food', 'dessert', 'beverages'],
    default: 'haryanvi',
  },
  tags:              [{ type: String }],
  avg_rating:        { type: Number, default: 0, min: 0, max: 5 },
  rating_count:      { type: Number, default: 0 },
  preparation_time_mins: { type: Number, default: 20 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
