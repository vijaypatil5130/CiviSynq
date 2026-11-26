const express = require('express');
const router = express.Router();

const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

// Get logged-in citizen's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Citizens only.'
      });
    }

    const notifications = await Notification.find({
      recipient: req.user.id
    })
      .populate('complaint', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.status(200).json({
      notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Unable to fetch notifications.'
    });
  }
});

// Mark one notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user.id
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found.'
      });
    }

    res.status(200).json({
      message: 'Notification marked as read.'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Unable to update notification.'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user.id,
        isRead: false
      },
      { isRead: true }
    );

    res.status(200).json({
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Unable to update notifications.'
    });
  }
});

module.exports = router;