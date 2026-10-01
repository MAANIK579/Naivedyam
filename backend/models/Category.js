const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  emoji:      { type: String, required: true },
  slug:       { type: String, required: true, unique: true, lowercase: true, index: true },
  sort_order: { type: Number, default: 0 },
  is_active:  { type: Boolean, default: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

categorySchema.pre('validate', function() {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
});

module.exports = mongoose.model('Category', categorySchema);
