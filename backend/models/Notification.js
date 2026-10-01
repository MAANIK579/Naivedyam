const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} },
  is_read: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: 'sent_at', updatedAt: 'updated_at' },
});

notificationSchema.index({ user: 1, sent_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
