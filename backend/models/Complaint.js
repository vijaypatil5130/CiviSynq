
const mongoose = require('mongoose');

// Comment schema
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

// Main complaint schema
const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    latitude: {
      type: Number,
      default: null
    },

    longitude: {
      type: Number,
      default: null
    },

    image: {
      type: String,
      default: ''
    },

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved'],
      default: 'Pending'
    },

    // Citizens who support this complaint
    supportedBy: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      default: []
    },

    // Comments posted by citizens
    comments: {
      type: [commentSchema],
      default: []
    }
  },
  { timestamps: true }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
