const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:        { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  full_address: { type: String, required: true },
  landmark:     { type: String, default: '' },
  lat:          { type: Number, default: 0 },
  lng:          { type: Number, default: 0 },
  is_default:   { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true, minlength: 2 },
  phone:      { type: String, required: true, unique: true, trim: true, index: true },
  email:      { type: String, trim: true, lowercase: true, default: '' },
  password:   { type: String, required: true, minlength: 6 },
  role:       { type: String, enum: ['customer', 'admin', 'delivery_partner'], default: 'customer' },
  addresses:  [addressSchema],
  favorites:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
  push_token: { type: String, default: '' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
