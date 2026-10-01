// routes/notifications.js — User notification management
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const authMiddleware = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// GET /api/notifications — List user's notifications (paginated)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const skip = (page - 1) * limit;

    const filter = { user: req.user.id };

    const [notifications, total, unread_count] = await Promise.all([
      Notification.find(filter)
        .sort({ sent_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user.id, is_read: false }),
    ]);

    const pages = Math.ceil(total / limit);
    res.json({ notifications, page, pages, total, unread_count });
  })
);

// PATCH /api/notifications/:id/read — Mark a single notification as read
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { is_read: true },
      { new: true }
    );

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    res.json({ message: 'Notification marked as read' });
  })
);

// PATCH /api/notifications/read-all — Mark all user's notifications as read
router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    await Notification.updateMany(
      { user: req.user.id, is_read: false },
      { is_read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  })
);

module.exports = router;
