// routes/track.js — Order tracking & admin status updates (MongoDB/Mongoose)
const express = require('express');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const asyncHandler = require('../utils/asyncHandler');
const { sendOrderNotification } = require('../services/notification.service');
const {
  sendOrderConfirmationAlert,
  sendOrderDispatchAlert,
  sendOrderDeliveredAlert,
  sendOrderCancelledAlert,
} = require('../services/communication.service');

const router = express.Router();

const STATUS_STEPS = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_META = {
  placed:           { label: 'Order Placed',     desc: 'We received your order!',                     eta: 'Just now' },
  confirmed:        { label: 'Order Confirmed',   desc: 'Navedyam kitchen has confirmed your order.',  eta: '2 min' },
  preparing:        { label: 'Preparing',         desc: 'Our chefs are cooking your meal fresh.',      eta: '20 min' },
  out_for_delivery: { label: 'Out for Delivery',  desc: 'Our delivery partner is on the way to you.', eta: '10 min' },
  delivered:        { label: 'Delivered',         desc: 'Enjoy your meal!',                            eta: 'Done' },
};

// GET /api/track/:orderId — tracking by order ID or display_id (requires auth)
router.get(
  '/:orderId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const searchId = req.params.orderId;

    // Try to find by _id first, then by display_id
    let order;
    if (searchId.match(/^[0-9a-fA-F]{24}$/)) {
      // Looks like a MongoDB ObjectId
      order = await Order.findById(searchId)
        .populate('items.menu_item', 'name price image_url emoji');
    }

    // If not found or not a valid ObjectId, try display_id
    if (!order) {
      order = await Order.findOne({ display_id: searchId.toUpperCase() })
        .populate('items.menu_item', 'name price image_url emoji');
    }

    // Also try with NVD- prefix if not provided
    if (!order && !searchId.toUpperCase().startsWith('NVD-')) {
      order = await Order.findOne({ display_id: 'NVD-' + searchId.toUpperCase() })
        .populate('items.menu_item', 'name price image_url emoji');
    }

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization check: User must be order owner or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    const currentIndex = STATUS_STEPS.indexOf(order.status);
    const steps = STATUS_STEPS.map((step, idx) => ({
      key:    step,
      label:  STATUS_META[step].label,
      desc:   STATUS_META[step].desc,
      eta:    STATUS_META[step].eta,
      done:   idx < currentIndex,
      active: idx === currentIndex,
    }));

    res.json({
      order: {
        id:               order._id,
        display_id:       order.display_id,
        status:           order.status,
        total:            order.grand_total,
        grand_total:      order.grand_total,
        item_total:       order.item_total,
        delivery_fee:     order.delivery_fee,
        gst:              order.gst,
        discount:         order.discount,
        address:          order.delivery_address?.full_address || '',
        delivery_address: order.delivery_address,
        created_at:       order.created_at,
        items:            order.items,
        status_history:   order.status_history,
      },
      steps,
      current_status: STATUS_META[order.status],
      estimated_delivery: order.estimated_delivery_time,
    });
  })
);

// PATCH /api/track/:orderId/status — admin & delivery_partner: update order status
router.patch(
  '/:orderId/status',
  authMiddleware,
  authorize('admin', 'delivery_partner'),
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!STATUS_STEPS.includes(status) && status !== 'cancelled') {
      return res.status(400).json({ error: 'Invalid status', valid: [...STATUS_STEPS, 'cancelled'] });
    }

    const order = await Order.findById(req.params.orderId).populate('user', 'name phone email');
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    order.status_history.push({
      status,
      timestamp: new Date(),
      note: req.body.note || '',
    });

    if (status === 'delivered') {
      order.delivered_at = new Date();
    }
    if (status === 'cancelled') {
      order.cancelled_at = new Date();
      order.cancellation_reason = req.body.note || 'Cancelled by admin';
      order.payment_status = 'cancelled';
    }

    await order.save();

    // Send push notification to the user
    try {
      const meta = STATUS_META[status] || { label: status, desc: '' };
      await sendOrderNotification(
        order.user?._id || order.user,
        `Order ${order.display_id} — ${meta.label}`,
        meta.desc,
        { orderId: order._id.toString(), status }
      );
    } catch (err) {
      console.error('Notification error:', err.message);
    }

    // Trigger WhatsApp & SMS communication alerts
    if (status === 'out_for_delivery') {
      sendOrderDispatchAlert(order.user, order).catch(err => {
        console.error('Dispatch alert error:', err.message);
      });
    } else if (status === 'delivered') {
      sendOrderDeliveredAlert(order.user, order).catch(err => {
        console.error('Delivered alert error:', err.message);
      });
    } else if (status === 'cancelled') {
      sendOrderCancelledAlert(order.user, order, order.cancellation_reason).catch(err => {
        console.error('Cancellation alert error:', err.message);
      });
    } else if (status === 'confirmed') {
      sendOrderConfirmationAlert(order.user, order).catch(err => {
        console.error('Confirmation alert error:', err.message);
      });
    }

    // Emit socket event if Socket.IO is configured
    const io = req.app.get('io');
    if (io) {
      io.to(`order:${order._id}`).emit('order:status_update', {
        orderId: order._id,
        status: order.status,
        meta: STATUS_META[status] || { label: status, desc: '', eta: '' },
        timestamp: new Date(),
      });
    }

    res.json({ message: 'Status updated', status });
  })
);

module.exports = router;
