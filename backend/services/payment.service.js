const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config');

// Create Razorpay instance only when keys are configured
let razorpayInstance = null;
if (config.razorpay.keyId && config.razorpay.keySecret) {
  razorpayInstance = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
}

/**
 * Create a Razorpay order.
 * @param {number} amount - Amount in paise (e.g. 50000 = Rs 500).
 * @param {string} receipt - A short receipt identifier.
 * @returns {Promise<Object>} Razorpay order object.
 */
async function createRazorpayOrder(amount, receipt) {
  if (!razorpayInstance) {
    throw new Error('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const order = await razorpayInstance.orders.create({
    amount,
    currency: 'INR',
    receipt,
  });

  return order;
}

/**
 * Verify Razorpay payment signature using HMAC SHA256.
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} signature
 * @returns {boolean}
 */
function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) {
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

module.exports = { createRazorpayOrder, verifyPaymentSignature };
