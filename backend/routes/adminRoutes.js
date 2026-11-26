const express = require('express');
const router = express.Router();

const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

// Admin access protection
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Admins only.'
    });
  }

  next();
};

// Get all complaints
router.get('/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('reportedBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ complaints });
  } catch (error) {
    res.status(500).json({
      message: 'Unable to fetch complaints.'
    });
  }
});

// Update complaint status and notify citizen
router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['Pending', 'In Progress', 'Resolved'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid complaint status.'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found.'
      });
    }

    const previousStatus = complaint.status;

    complaint.status = status;
    await complaint.save();

    // Create notification only when the status actually changes
    if (previousStatus !== status) {
      try {
        await Notification.create({
          recipient: complaint.reportedBy,
          complaint: complaint._id,
          title: 'Complaint Status Updated',
          message: `Your complaint "${complaint.title}" has been updated from ${previousStatus} to ${status}.`,
          status,
          isRead: false
        });
      } catch (notificationError) {
        console.error(
          'Notification creation failed:',
          notificationError.message
        );
      }
    }

    res.status(200).json({
      message: 'Complaint status updated successfully.',
      complaint
    });
  } catch (error) {
    res.status(500).json({
      message: 'Unable to update complaint status.'
    });
  }
});

module.exports = router;