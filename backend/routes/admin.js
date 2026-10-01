// routes/admin.js — Admin dashboard, order management, menu management, analytics
const express = require('express');
const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Category = require('../models/Category');
const { createMenuItemSchema, createCategorySchema } = require('../validators/menu.validator');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware, authorize('admin'));

// GET /api/admin/dashboard — Dashboard stats
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayStats, total_users, pending_orders, popular_items] = await Promise.all([
      // Today's orders and revenue
      Order.aggregate([
        { $match: { created_at: { $gte: todayStart } } },
        {
          $group: {
            _id: null,
            today_orders: { $sum: 1 },
            today_revenue: { $sum: '$grand_total' },
          },
        },
      ]),
      // Total users
      User.countDocuments(),
      // Pending orders (placed or confirmed)
      Order.countDocuments({ status: { $in: ['placed', 'confirmed'] } }),
      // Top 5 popular items by order count
      Order.aggregate([
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.menu_item',
            item_name: { $first: '$items.item_name' },
            order_count: { $sum: '$items.quantity' },
          },
        },
        { $sort: { order_count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const stats = {
      today_orders: todayStats.length > 0 ? todayStats[0].today_orders : 0,
      today_revenue: todayStats.length > 0 ? todayStats[0].today_revenue : 0,
      total_users,
      pending_orders,
      popular_items,
    };

    res.json({ stats });
  })
);

// GET /api/admin/orders — List all orders with pagination and filters
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by date range
    if (req.query.date_from || req.query.date_to) {
      filter.created_at = {};
      if (req.query.date_from) {
        filter.created_at.$gte = new Date(req.query.date_from);
      }
      if (req.query.date_to) {
        filter.created_at.$lte = new Date(req.query.date_to);
      }
    }

    // Search by display_id
    if (req.query.search) {
      filter.display_id = { $regex: req.query.search, $options: 'i' };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name phone')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);
    res.json({ orders, page, pages, total });
  })
);

// GET /api/admin/orders/:id — Single order detail
router.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
      .populate('user', '-password')
      .populate('items.menu_item', 'name price image_url emoji')
      .lean();

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const address = order.delivery_address || {};
    const normalizedAddress = {
      ...address,
      line1: address.line1 || address.address_line1 || address.full_address || '',
      line2: address.line2 || address.address_line2 || address.landmark || '',
      city: address.city || '',
      pincode: address.pincode || address.zip || '',
    };

    const normalizedItems = (order.items || []).map((item) => {
      const menuItem = item.menu_item && typeof item.menu_item === 'object' ? item.menu_item : null;
      const quantity = item.quantity || 1;
      const unitPrice = item.price ?? menuItem?.price ?? 0;

      return {
        ...item,
        name: item.item_name || menuItem?.name || 'Item',
        unit_price: unitPrice,
        subtotal: Number((unitPrice * quantity).toFixed(2)),
      };
    });

    const billSummary = {
      item_total: order.item_total ?? 0,
      delivery_fee: order.delivery_fee ?? 0,
      gst: order.gst ?? 0,
      discount: order.discount ?? 0,
      grand_total: order.grand_total ?? 0,
    };

    res.json({
      order: {
        ...order,
        customer: order.user,
        items: normalizedItems,
        delivery_address: normalizedAddress,
        bill_summary: billSummary,
        total_amount: billSummary.grand_total,
        payment_id: order.razorpay_payment_id || '',
      },
    });
  })
);

// PATCH /api/admin/orders/:id/payment — Mark COD/UPI payment as paid
router.patch(
  '/orders/:id/payment',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Allow marking COD and UPI orders as paid (Razorpay is auto-verified)
    if (order.payment_method === 'razorpay' && order.payment_status === 'paid') {
      throw new ApiError(400, 'Razorpay payment is already verified automatically');
    }

    const { payment_status } = req.body;
    if (!['pending', 'paid', 'cancelled'].includes(payment_status)) {
      throw new ApiError(400, 'Invalid payment status. Must be "pending", "paid" or "cancelled"');
    }

    order.payment_status = payment_status;
    if (payment_status === 'paid') {
      const paymentNote = order.payment_method === 'cod' ? 'Cash payment collected' : 'Payment verified manually';
      order.status_history.push({
        status: order.status,
        timestamp: new Date(),
        note: paymentNote,
      });
    }
    await order.save();

    res.json({ message: 'Payment status updated', payment_status: order.payment_status });
  })
);

// GET /api/admin/users — List users with pagination and aggregate stats
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();

    const users = await User.aggregate([
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'user_orders',
        },
      },
      {
        $addFields: {
          orders_count: { $size: '$user_orders' },
          total_spent: { $sum: '$user_orders.grand_total' },
        },
      },
      {
        $project: {
          password: 0,
          user_orders: 0,
        },
      },
    ]);

    const pages = Math.ceil(total / limit);
    res.json({ users, page, pages, total });
  })
);

// POST /api/admin/menu/items — Create a menu item
router.get(
  '/menu/items',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 200);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.stock === 'in_stock') {
      filter.is_available = true;
    } else if (req.query.stock === 'out_of_stock') {
      filter.is_available = false;
    }

    const [items, total] = await Promise.all([
      MenuItem.find(filter)
        .populate('category', 'name slug emoji is_active')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MenuItem.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  })
);

router.get(
  '/menu/categories',
  asyncHandler(async (req, res) => {
    const status = req.query.status;
    const filter = {};

    if (status === 'active') {
      filter.is_active = true;
    } else if (status === 'inactive') {
      filter.is_active = false;
    }

    const categories = await Category.find(filter)
      .sort({ sort_order: 1, name: 1 })
      .lean();

    res.json({ categories });
  })
);

// POST /api/admin/menu/items — Create a menu item
router.post(
  '/menu/items',
  validate(createMenuItemSchema),
  asyncHandler(async (req, res) => {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ item });
  })
);

// PUT /api/admin/menu/items/:id — Update a menu item
router.put(
  '/menu/items/:id',
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }
    res.json({ item });
  })
);

// DELETE /api/admin/menu/items/:id — Soft delete a menu item
router.delete(
  '/menu/items/:id',
  asyncHandler(async (req, res) => {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { is_available: false },
      { new: true }
    );
    if (!item) {
      throw new ApiError(404, 'Menu item not found');
    }
    res.json({ message: 'Menu item marked as unavailable' });
  })
);

// POST /api/admin/menu/categories — Create a category
router.post(
  '/menu/categories',
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    // Auto-generate slug from name if not provided
    if (!req.body.slug && req.body.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    const category = await Category.create(req.body);
    res.status(201).json({ category });
  })
);

// PUT /api/admin/menu/categories/:id — Update a category
router.put(
  '/menu/categories/:id',
  asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    res.json({ category });
  })
);

// GET /api/admin/analytics — Analytics data
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const parsedRange = parseInt(req.query.range, 10);
    const rangeDays = Number.isFinite(parsedRange) && parsedRange > 0 ? parsedRange : 30;

    const now = new Date();
    const startDate = req.query.date_from ? new Date(req.query.date_from) : new Date(now);
    if (!req.query.date_from) {
      startDate.setDate(startDate.getDate() - rangeDays);
    }
    if (Number.isNaN(startDate.getTime())) {
      startDate.setTime(now.getTime());
      startDate.setDate(startDate.getDate() - 30);
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = req.query.date_to ? new Date(req.query.date_to) : new Date(now);
    if (Number.isNaN(endDate.getTime())) {
      endDate.setTime(now.getTime());
    }
    endDate.setHours(23, 59, 59, 999);

    const createdAtFilter = { created_at: { $gte: startDate, $lte: endDate } };

    const [orders_by_day, revenue_by_day, orders_by_status, peak_hours, top_items, customer_growth] =
      await Promise.all([
        // Orders per day (last 30 days)
        Order.aggregate([
          { $match: createdAtFilter },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Revenue per day (last 30 days)
        Order.aggregate([
          { $match: createdAtFilter },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
              },
              revenue: { $sum: '$grand_total' },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Orders by status (pie chart data)
        Order.aggregate([
          { $match: createdAtFilter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),

        // Peak hours (orders grouped by hour)
        Order.aggregate([
          { $match: createdAtFilter },
          {
            $group: {
              _id: { $hour: '$created_at' },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // Top 10 most ordered items
        Order.aggregate([
          { $match: createdAtFilter },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.menu_item',
              item_name: { $first: '$items.item_name' },
              total_ordered: { $sum: '$items.quantity' },
              total_revenue: {
                $sum: { $multiply: ['$items.price', '$items.quantity'] },
              },
            },
          },
          { $sort: { total_ordered: -1 } },
          { $limit: 10 },
        ]),

        // Customer growth (new users per day last 30 days)
        User.aggregate([
          { $match: { created_at: { $gte: startDate, $lte: endDate } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$created_at' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
      ]);

    const orders_by_status_map = orders_by_status.reduce((acc, entry) => {
      if (entry?._id) {
        acc[entry._id] = entry.count;
      }
      return acc;
    }, {});

    const normalized_top_items = top_items.map((item) => ({
      ...item,
      name: item.item_name,
      order_count: item.total_ordered,
    }));

    res.json({
      orders_by_date: orders_by_day,
      revenue_by_date: revenue_by_day,
      orders_by_day,
      revenue_by_day,
      orders_by_status,
      orders_by_status_map,
      peak_hours,
      top_items: normalized_top_items,
      customer_growth,
    });
  })
);

module.exports = router;
