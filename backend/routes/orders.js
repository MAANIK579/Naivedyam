// routes/orders.js — Place, list, reorder & cancel orders (MongoDB/Mongoose)
const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { placeOrderSchema } = require('../validators/order.validator');
const asyncHandler = require('../utils/asyncHandler');
const { validateCoupon, applyCouponUsage } = require('../services/coupon.service');
const { sendOrderNotification } = require('../services/notification.service');

const router = express.Router();

// All order routes require authentication
router.use(authMiddleware);

// POST /api/orders — place a new order
router.post(
  '/',
  validate(placeOrderSchema),
  asyncHandler(async (req, res) => {
    const { items, address, notes, coupon_code, payment_method } = req.body;

    // Batch-fetch all menu items
    const itemIds = items.map(e => e.item_id);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } });
    const menuMap = {};
    for (const mi of menuItems) menuMap[mi._id.toString()] = mi;

    let itemTotal = 0;
    const resolvedItems = [];

    for (const entry of items) {
      const menuItem = menuMap[entry.item_id];
      if (!menuItem || !menuItem.is_available) {
        return res.status(400).json({ error: `Item ${entry.item_id} not found or unavailable` });
      }
      const qty = parseInt(entry.quantity, 10);
      if (!qty || qty < 1) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }
      itemTotal += menuItem.price * qty;
      resolvedItems.push({ menuItem, qty });
    }

    // Apply coupon if provided
    let discount = 0;
    let couponId = null;
    if (coupon_code) {
      const couponResult = await validateCoupon(coupon_code, req.user.id, itemTotal);
      if (!couponResult.valid) {
        return res.status(400).json({ error: couponResult.message || 'Invalid coupon' });
      }
      discount = couponResult.discount || 0;
      couponId = couponResult.coupon_id;
    }

    const deliveryFee = 30;
    const gst = parseFloat((itemTotal * 0.05).toFixed(2));
    const grandTotal = parseFloat((itemTotal + deliveryFee + gst - discount).toFixed(2));

    // Build delivery address
    let deliveryAddress;
    if (typeof address === 'string') {
      deliveryAddress = { full_address: address };
    } else {
      deliveryAddress = address;
    }

    // Build order items array
    const orderItems = resolvedItems.map(({ menuItem, qty }) => ({
      menu_item: menuItem._id,
      item_name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
    }));

    // Calculate estimated delivery time based on items
    const totalQty = resolvedItems.reduce((sum, { qty }) => sum + qty, 0);
    const baseTime = 25; // Base prep time in minutes
    const perItemTime = 3; // Additional minutes per item
    const deliveryTime = 10; // Fixed delivery time
    const estimatedMinutes = Math.min(baseTime + (totalQty * perItemTime) + deliveryTime, 60);
    const estimatedDelivery = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      item_total: itemTotal,
      delivery_fee: deliveryFee,
      gst,
      discount,
      grand_total: grandTotal,
      delivery_address: deliveryAddress,
      notes: notes || '',
      coupon_code: coupon_code || '',
      payment_method: payment_method || 'cod',
      estimated_delivery_time: estimatedDelivery,
    });

    // Record coupon usage
    if (couponId) {
      await applyCouponUsage(couponId, req.user.id);
    }

    // For non-Razorpay orders (e.g. COD/UPI), notify kitchen and user immediately
    if (order.payment_method !== 'razorpay') {
      try {
        await sendOrderNotification(
          req.user.id,
          `Order ${order.display_id} Placed!`,
          `Your order is confirmed. Estimated delivery: ${estimatedMinutes} mins.`,
          { orderId: order._id.toString(), status: 'placed' }
        );
      } catch (err) {
        console.error('Order notification error:', err.message);
      }

      // Notify kitchen via Socket.IO
      const io = req.app.get('io');
      if (io) {
        io.to('kitchen').emit('new:order', {
          orderId: order._id,
          display_id: order.display_id,
          items: orderItems,
          grand_total: grandTotal,
          timestamp: new Date(),
        });
      }
    }

    res.status(201).json({
      message: 'Order placed successfully!',
      order: {
        id: order._id,
        display_id: order.display_id,
        status: order.status,
        grand_total: order.grand_total,
        item_total: order.item_total,
        delivery_fee: order.delivery_fee,
        gst: order.gst,
        discount: order.discount,
        delivery_address: order.delivery_address,
        estimated_delivery_time: order.estimated_delivery_time,
        estimated_minutes: estimatedMinutes,
        items: resolvedItems.map(({ menuItem, qty }) => ({
          name: menuItem.name,
          price: menuItem.price,
          quantity: qty,
          subtotal: menuItem.price * qty,
        })),
        created_at: order.created_at,
      },
    });
  })
);

// GET /api/orders — list my orders
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user.id })
      .sort('-created_at')
      .populate('items.menu_item', 'name price image_url emoji');

    res.json({ orders });
  })
);

// GET /api/orders/:id — single order detail
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
      .populate('items.menu_item', 'name price image_url emoji');

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  })
);

// POST /api/orders/:id/reorder — reorder from a previous order
router.post(
  '/:id/reorder',
  asyncHandler(async (req, res) => {
    const oldOrder = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!oldOrder) return res.status(404).json({ error: 'Order not found' });

    // Validate that the items still exist and are available
    let itemTotal = 0;
    const resolvedItems = [];

    for (const entry of oldOrder.items) {
      const menuItem = await MenuItem.findById(entry.menu_item);
      if (!menuItem || !menuItem.is_available) {
        // Skip unavailable items but note them
        continue;
      }
      const qty = entry.quantity;
      itemTotal += menuItem.price * qty;
      resolvedItems.push({ menuItem, qty });
    }

    if (resolvedItems.length === 0) {
      return res.status(400).json({ error: 'None of the items from the previous order are currently available' });
    }

    const deliveryFee = 30;
    const gst = parseFloat((itemTotal * 0.05).toFixed(2));
    const grandTotal = parseFloat((itemTotal + deliveryFee + gst).toFixed(2));

    const orderItems = resolvedItems.map(({ menuItem, qty }) => ({
      menu_item: menuItem._id,
      item_name: menuItem.name,
      price: menuItem.price,
      quantity: qty,
    }));

    const newOrder = await Order.create({
      user: req.user.id,
      items: orderItems,
      item_total: itemTotal,
      delivery_fee: deliveryFee,
      gst,
      discount: 0,
      grand_total: grandTotal,
      delivery_address: oldOrder.delivery_address,
      notes: '',
      payment_method: oldOrder.payment_method || 'cod',
    });

    res.status(201).json({
      message: 'Reorder placed successfully!',
      order: {
        id: newOrder._id,
        display_id: newOrder.display_id,
        status: newOrder.status,
        grand_total: newOrder.grand_total,
        item_total: newOrder.item_total,
        delivery_fee: newOrder.delivery_fee,
        gst: newOrder.gst,
        delivery_address: newOrder.delivery_address,
        items: resolvedItems.map(({ menuItem, qty }) => ({
          name: menuItem.name,
          price: menuItem.price,
          quantity: qty,
          subtotal: menuItem.price * qty,
        })),
        created_at: newOrder.created_at,
      },
    });
  })
);

// POST /api/orders/:id/cancel — cancel an order
router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'placed' && order.status !== 'confirmed') {
      return res.status(400).json({
        error: 'Order can only be cancelled when status is placed or confirmed',
      });
    }

    order.status = 'cancelled';
    order.payment_status = 'cancelled';
    order.cancelled_at = new Date();
    order.cancellation_reason = req.body.reason || 'Cancelled by user';
    order.status_history.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: req.body.reason || 'Cancelled by user',
    });

    await order.save();

    res.json({ message: 'Order cancelled successfully' });
  })
);

module.exports = router;
