
const express = require('express');
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

// Normalize category names for accurate counting
const normalizeCategory = (value) => {
  const category = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');

  const categoryAliases = {
    garbage: 'Garbage',
    'road damage': 'Road Damage',
    road: 'Road Damage',
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

// Upload image buffer to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'civisynq/complaints',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

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

    // Validate map coordinates
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

    // Upload image to Cloudinary if provided
    if (req.file) {
      uploadedImage = await uploadToCloudinary(req.file.buffer);
    }

    // Save complaint in MongoDB
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
    // Remove uploaded image if complaint saving fails
    if (uploadedImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
      } catch (cleanupError) {
        console.error(
          'Cloudinary cleanup failed:',
          cleanupError.message
        );
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

    return res.status(200).json({
      complaints
    });

  } catch (error) {
    console.error('Fetch complaints error:', error);

    return res.status(500).json({
      message: 'Unable to fetch complaints.'
    });
  }
});

// Get all community complaints and category priority ranking
router.get('/community/all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can access community complaints.'
      });
    }

    // Fetch complaints from all citizens
    const complaints = await Complaint.find({})
      .select(
        'title category description location latitude longitude image status createdAt updatedAt reportedBy'
      )
      .populate('reportedBy', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    // Count every complaint using normalized category names
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

    // Generate dynamic category ranking
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

    return res.status(200).json({
      message: 'Community complaints fetched successfully.',
      totalComplaints: complaints.length,
      complaints,
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
