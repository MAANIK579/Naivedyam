// routes/payments.js — Razorpay payment order creation & verification
const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authMiddleware = require('../middleware/auth');
const Order = require('../models/Order');
const config = require('../config');
const { sendOrderNotification } = require('../services/notification.service');
const { sendOrderConfirmationAlert } = require('../services/communication.service');

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

// All payment routes require authentication
router.use(authMiddleware);

// POST /api/payments/create-order — Create a Razorpay order
router.post(
  '/create-order',
  asyncHandler(async (req, res) => {
    const { order_id } = req.body;

    if (!order_id) {
      throw new ApiError(400, 'order_id is required');
    }

    // Find the order and verify ownership
    const order = await Order.findById(order_id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    if (order.user.toString() !== req.user.id) {
      throw new ApiError(403, 'This order does not belong to you');
    }
    if (order.payment_status !== 'pending') {
      throw new ApiError(400, 'Payment has already been processed for this order');
    }

    // Create Razorpay order (amount in paise)
    const amountInPaise = Math.round(order.grand_total * 100);
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.display_id || order._id.toString(),
    });

    // Save razorpay_order_id on the order
    order.razorpay_order_id = razorpayOrder.id;
    await order.save();

    res.json({
      razorpay_order_id: razorpayOrder.id,
      amount: amountInPaise,
      key_id: config.razorpay.keyId,
    });
  })
);

// POST /api/payments/verify — Verify Razorpay payment signature
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new ApiError(400, 'razorpay_order_id, razorpay_payment_id and razorpay_signature are required');
    }

    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, 'Payment verification failed: invalid signature');
    }

    // Update order on successful verification
    const order = await Order.findOne({ razorpay_order_id });
    if (!order) {
      throw new ApiError(404, 'Order not found for this payment');
    }

    order.payment_status = 'paid';
    order.razorpay_payment_id = razorpay_payment_id;
    order.status = 'confirmed';
    order.status_history.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment verified via Razorpay',
    });
    await order.save();

    // Send user confirmation notification
    try {
      await sendOrderNotification(
        order.user,
        `Order ${order.display_id} Confirmed!`,
        'Payment received via Razorpay. Navedyam kitchen has confirmed your order.',
        { orderId: order._id.toString(), status: 'confirmed' }
      );
    } catch (err) {
      console.error('Payment notification error:', err.message);
    }

    // Trigger customer WhatsApp & SMS confirmation alert
    sendOrderConfirmationAlert(req.user, order).catch(err => {
      console.error('Communication alert error:', err.message);
    });

    // Emit socket events to kitchen and customer
    const io = req.app.get('io');
    if (io) {
      // Notify kitchen of new paid order
      io.to('kitchen').emit('new:order', {
        orderId: order._id,
        display_id: order.display_id,
        items: order.items,
        grand_total: order.grand_total,
        timestamp: new Date(),
      });

      // Update customer tracking screen
      io.to(`order:${order._id}`).emit('order:status_update', {
        orderId: order._id,
        status: 'confirmed',
        meta: {
          label: 'Order Confirmed',
          desc: 'Payment received via Razorpay. Navedyam kitchen has confirmed your order.',
          eta: '2 min',
        },
        timestamp: new Date(),
      });
    }

    res.json({ message: 'Payment verified successfully' });
  })
);

module.exports = router;
