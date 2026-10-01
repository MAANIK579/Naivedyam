const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menu_item:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  item_name:  { type: String, required: true },
  price:      { type: Number, required: true },
  quantity:   { type: Number, required: true, min: 1 },
}, { _id: true });

const statusHistorySchema = new mongoose.Schema({
  status:    { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  note:      { type: String, default: '' },
}, { _id: false });

const deliveryAddressSchema = new mongoose.Schema({
  label:        { type: String, default: '' },
  full_address: { type: String, required: true },
  landmark:     { type: String, default: '' },
  lat:          { type: Number, default: 0 },
  lng:          { type: Number, default: 0 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  display_id:   { type: String, unique: true, index: true },
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items:        [orderItemSchema],
  status: {
    type: String,
    enum: ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed',
    index: true,
  },
  item_total:    { type: Number, required: true },
  delivery_fee:  { type: Number, default: 30 },
  gst:           { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },
  grand_total:   { type: Number, required: true },
  delivery_address: deliveryAddressSchema,
  notes:         { type: String, default: '' },
  coupon_code:   { type: String, default: '' },
  payment_method: {
    type: String,
    enum: ['cod', 'upi', 'razorpay'],
    default: 'cod',
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  razorpay_order_id:   { type: String, default: '' },
  razorpay_payment_id: { type: String, default: '' },
  delivery_partner:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  estimated_delivery_time: { type: Date },
  delivered_at:        { type: Date },
  cancelled_at:        { type: Date },
  cancellation_reason: { type: String, default: '' },
  status_history:      [statusHistorySchema],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

orderSchema.index({ user: 1, created_at: -1 });

orderSchema.pre('save', async function() {
  if (this.isNew && !this.display_id) {
    // Try generating a unique display_id with retry logic
    const Order = mongoose.model('Order');
    let attempts = 0;
    while (attempts < 10) {
      const id = 'NVD-' + String(10000 + Math.floor(Math.random() * 90000));
      const exists = await Order.findOne({ display_id: id }).lean();
      if (!exists) {
        this.display_id = id;
        break;
      }
      attempts++;
    }
    if (!this.display_id) {
      // Fallback: timestamp-based
      this.display_id = 'NVD-' + Date.now().toString().slice(-6);
    }
  }
  if (this.isNew) {
    this.status_history.push({ status: 'placed', timestamp: new Date() });
  }
});

module.exports = mongoose.model('Order', orderSchema);
