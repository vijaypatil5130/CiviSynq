
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const Complaint = require('../models/Complaint');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const allowedCategories = [
  'Garbage',
  'Road Damage',
  'Electricity',
  'Water Supply',
  'Drainage',
  'Other'
];

const removeUploadedFile = (file) => {
  if (file) {
    const filePath = path.join(__dirname, '../uploads', file.filename);

    fs.unlink(filePath, () => {});
  }
};

// CREATE COMPLAINT
router.post(
  '/',
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Only citizens can submit complaints.'
      });
    }

    next();
  },
  upload.single('image'),
  async (req, res) => {
    try {
      const {
        title,
        category,
        description,
        location,
        latitude,
        longitude
      } = req.body;

      if (
        typeof title !== 'string' ||
        typeof category !== 'string' ||
        typeof description !== 'string' ||
        typeof location !== 'string'
      ) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Please provide valid complaint details.'
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
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Please fill in all required fields.'
        });
      }

      if (cleanTitle.length > 120) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Complaint title cannot exceed 120 characters.'
        });
      }

      if (cleanDescription.length > 3000) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Description cannot exceed 3000 characters.'
        });
      }

      if (cleanLocation.length > 250) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Location cannot exceed 250 characters.'
        });
      }

      if (!allowedCategories.includes(cleanCategory)) {
        removeUploadedFile(req.file);

        return res.status(400).json({
          message: 'Please select a valid complaint category.'
        });
      }

      let savedLatitude = null;
      let savedLongitude = null;

      const hasLatitude = latitude !== undefined && latitude !== '';
      const hasLongitude = longitude !== undefined && longitude !== '';

      if (hasLatitude || hasLongitude) {
        const lat = Number(latitude);
        const lng = Number(longitude);

        if (
          !hasLatitude ||
          !hasLongitude ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          removeUploadedFile(req.file);

          return res.status(400).json({
            message: 'Please select a valid location on the map.'
          });
        }

        savedLatitude = lat;
        savedLongitude = lng;
      }

      const complaint = new Complaint({
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDescription,
        location: cleanLocation,
        latitude: savedLatitude,
        longitude: savedLongitude,
        image: req.file ? `/uploads/${req.file.filename}` : '',
        reportedBy: req.user.id
      });

      await complaint.save();

      return res.status(201).json({
        message: 'Complaint submitted successfully!',
        complaint
      });
    } catch (error) {
      removeUploadedFile(req.file);

      console.error('Complaint Submission Error:', error.message);

      return res.status(500).json({
        message: 'Unable to submit complaint.'
      });
    }
  }
);

// GET CITIZEN'S OWN COMPLAINTS
router.get('/my-complaints', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        message: 'Access denied.'
      });
    }

    const complaints = await Complaint.find({
      reportedBy: req.user.id
    }).sort({ createdAt: -1 });

    return res.status(200).json({ complaints });
  } catch (error) {
    console.error('Fetch Complaints Error:', error.message);

    return res.status(500).json({
      message: 'Unable to fetch complaints.'
    });
  }
});

module.exports = router;
