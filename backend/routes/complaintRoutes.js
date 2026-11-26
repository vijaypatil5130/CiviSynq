
const express = require('express');
const mongoose = require('mongoose');
const { Readable } = require('stream');

const Complaint = require('../models/Complaint');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

const allowedCategories = [
  'Garbage',
  'Road Damage',
  'Electricity',
  'Water Supply',
  'Drainage',
  'Other'
];

const normalizeCategory = (value) => {
  const category = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');

  const categoryAliases = {
    garbage: 'Garbage',
    road: 'Road Damage',
    'road damage': 'Road Damage',
    electricity: 'Electricity',
    streetlight: 'Electricity',
    'street light': 'Electricity',
    'street lighting': 'Electricity',
    'water supply': 'Water Supply',
    drainage: 'Drainage',
    other: 'Other'
  };

  return categoryAliases[category] || null;
};

const validId = (id) => mongoose.isValidObjectId(id);

// Upload image buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'civisynq/complaints',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from([buffer]).pipe(uploadStream);
  });
};

// Create a new complaint
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  let uploadedImage = null;

  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can report complaints.'
      });
    }

    const {
      title,
      category,
      description,
      location,
      latitude,
      longitude
    } = req.body;

    if (!title || !category || !description || !location) {
      return res.status(400).json({
        message: 'Please provide all required complaint details.'
      });
    }

    const cleanTitle = title.trim();
    const cleanCategory = category.trim();
    const cleanDescription = description.trim();
    const cleanLocation = location.trim();

    if (
      !cleanTitle ||
      !cleanCategory ||
      !cleanDescription ||
      !cleanLocation
    ) {
      return res.status(400).json({
        message: 'Complaint fields cannot be empty.'
      });
    }

    if (!allowedCategories.includes(cleanCategory)) {
      return res.status(400).json({
        message: 'Invalid complaint category.'
      });
    }

    if (cleanTitle.length > 120) {
      return res.status(400).json({
        message: 'Title cannot exceed 120 characters.'
      });
    }

    if (cleanDescription.length > 3000) {
      return res.status(400).json({
        message: 'Description cannot exceed 3000 characters.'
      });
    }

    if (cleanLocation.length > 250) {
      return res.status(400).json({
        message: 'Location cannot exceed 250 characters.'
      });
    }

    let parsedLatitude;
    let parsedLongitude;

    if (
      (latitude !== undefined && latitude !== '') ||
      (longitude !== undefined && longitude !== '')
    ) {
      parsedLatitude = Number(latitude);
      parsedLongitude = Number(longitude);

      if (
        latitude === undefined || latitude === '' ||
        longitude === undefined || longitude === '' ||
        !Number.isFinite(parsedLatitude) ||
        !Number.isFinite(parsedLongitude) ||
        parsedLatitude < -90 ||
        parsedLatitude > 90 ||
        parsedLongitude < -180 ||
        parsedLongitude > 180
      ) {
        return res.status(400).json({
          message: 'Please provide valid latitude and longitude.'
        });
      }
    }

    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.buffer);
    }

    const complaint = new Complaint({
      title: cleanTitle,
      category: cleanCategory,
      description: cleanDescription,
      location: cleanLocation,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      image: uploadedImage ? uploadedImage.secure_url : '',
      reportedBy: req.user.id
    });

    await complaint.save();

    return res.status(201).json({
      message: 'Complaint submitted successfully.',
      complaint
    });

  } catch (error) {
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed:', cleanupError.message);
      }
    }

    console.error('Complaint creation error:', error);

    return res.status(500).json({
      message: 'Unable to submit complaint. Please try again.'
    });
  }
});

// Get complaints submitted by logged-in citizen
router.get('/my-complaints', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can access their complaints.'
      });
    }

    const complaints = await Complaint.find({
      reportedBy: req.user.id
    }).sort({ createdAt: -1 });

    return res.status(200).json({ complaints });

  } catch (error) {
    console.error('Fetch complaints error:', error);

    return res.status(500).json({
      message: 'Unable to fetch complaints.'
    });
  }
});

// Support a complaint: I face this too
router.put('/:id/support', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can support complaints.'
      });
    }

    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid complaint ID.'
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: {
          supportedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found.'
      });
    }

    return res.status(200).json({
      message: 'You have supported this complaint.',
      supportCount: complaint.supportedBy.length,
      hasSupported: true
    });

  } catch (error) {
    console.error('Support complaint error:', error);

    return res.status(500).json({
      message: 'Unable to support this complaint.'
    });
  }
});

// Remove support from a complaint
router.delete('/:id/support', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can remove their support.'
      });
    }

    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid complaint ID.'
      });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          supportedBy: req.user.id
        }
      },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found.'
      });
    }

    return res.status(200).json({
      message: 'Your support has been removed.',
      supportCount: complaint.supportedBy.length,
      hasSupported: false
    });

  } catch (error) {
    console.error('Remove support error:', error);

    return res.status(500).json({
      message: 'Unable to remove your support.'
    });
  }
});

// Add a comment to a complaint
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can comment on complaints.'
      });
    }

    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid complaint ID.'
      });
    }

    const text = String(req.body.text || '').trim();

    if (!text) {
      return res.status(400).json({
        message: 'Comment cannot be empty.'
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        message: 'Comment cannot exceed 1000 characters.'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        message: 'Complaint not found.'
      });
    }

    complaint.comments.push({
      text,
      author: req.user.id
    });

    await complaint.save();

    const newComment = complaint.comments[
      complaint.comments.length - 1
    ];

    await complaint.populate({
      path: 'comments.author',
      select: 'fullName'
    });

    const populatedComment = complaint.comments.id(newComment._id);

    return res.status(201).json({
      message: 'Comment added successfully.',
      comment: populatedComment
    });

  } catch (error) {
    console.error('Add comment error:', error);

    return res.status(500).json({
      message: 'Unable to add comment.'
    });
  }
});

// Delete a comment: owner or admin only
router.delete(
  '/:id/comments/:commentId',
  authMiddleware,
  async (req, res) => {
    try {
      if (
        !validId(req.params.id) ||
        !validId(req.params.commentId)
      ) {
        return res.status(400).json({
          message: 'Invalid complaint or comment ID.'
        });
      }

      if (!['citizen', 'admin'].includes(req.user.role)) {
        return res.status(403).json({
          message: 'You are not allowed to delete comments.'
        });
      }

      const complaint = await Complaint.findById(req.params.id);

      if (!complaint) {
        return res.status(404).json({
          message: 'Complaint not found.'
        });
      }

      const comment = complaint.comments.id(req.params.commentId);

      if (!comment) {
        return res.status(404).json({
          message: 'Comment not found.'
        });
      }

      const isAdmin = req.user.role === 'admin';
      const isCommentOwner =
        comment.author.toString() === req.user.id.toString();

      if (!isAdmin && !isCommentOwner) {
        return res.status(403).json({
          message: 'You can delete only your own comments.'
        });
      }

      comment.deleteOne();
      await complaint.save();

      return res.status(200).json({
        message: 'Comment deleted successfully.',
        commentId: req.params.commentId
      });

    } catch (error) {
      console.error('Delete comment error:', error);

      return res.status(500).json({
        message: 'Unable to delete comment.'
      });
    }
  }
);

// Get all community complaints and category priority ranking
router.get('/community/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can access community complaints.'
      });
    }

    const complaints = await Complaint.find({})
      .select(
        'title category description location latitude longitude image status createdAt updatedAt reportedBy supportedBy comments'
      )
      .populate('reportedBy', 'fullName')
      .populate('comments.author', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    const countMap = {};

    allowedCategories.forEach((category) => {
      countMap[category] = 0;
    });

    complaints.forEach((complaint) => {
      const normalizedCategory = normalizeCategory(complaint.category);

      if (normalizedCategory) {
        countMap[normalizedCategory] += 1;
      }
    });

    const categoryRanking = allowedCategories
      .map((category) => ({
        category,
        count: countMap[category]
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return a.category.localeCompare(b.category);
      })
      .map((item, index) => ({
        ...item,
        priority: index + 1
      }));

    const currentUserId = req.user.id.toString();

    const communityComplaints = complaints.map((complaint) => {
      const supporters = complaint.supportedBy || [];

      return {
        ...complaint,
        supportCount: supporters.length,
        hasSupported: supporters.some(
          (userId) => userId.toString() === currentUserId
        ),
        comments: complaint.comments || []
      };
    });

    return res.status(200).json({
      message: 'Community complaints fetched successfully.',
      totalComplaints: communityComplaints.length,
      complaints: communityComplaints,
      categoryRanking
    });

  } catch (error) {
    console.error('Community complaints error:', error);

    return res.status(500).json({
      message: 'Unable to fetch community complaints.'
    });
  }
});

module.exports = router;
