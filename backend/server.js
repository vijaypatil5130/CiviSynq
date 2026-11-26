
require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Check required environment variables before starting.
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('Missing MONGO_URI or JWT_SECRET in backend/.env');
  process.exit(1);
}

// Ensure the uploads directory exists.
const uploadsDirectory = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDirectory, { recursive: true });

// Security headers.
// Cross-origin resource policy allows the React frontend to display uploaded photos.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
  })
);

// CORS configuration.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:5173', 'http://127.0.0.1:5173']
    : [])
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server or Postman requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('This origin is not allowed by CORS.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Limit JSON request size.
app.use(express.json({ limit: '10kb' }));

// Serve uploaded complaint images.
app.use('/uploads', express.static(uploadsDirectory, {
  dotfiles: 'deny',
  index: false,
  maxAge: '1d'
}));

// Rate limiting for authentication endpoints.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many registration attempts. Please try again later.'
  }
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health-check route.
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'CiviSynq Backend is Running!',
    status: 'OK'
  });
});

// Handle unknown routes.
app.use((req, res) => {
  res.status(404).json({
    message: 'The requested API endpoint was not found.'
  });
});

// Central error handler.
app.use((error, req, res, next) => {
  console.error('Server Error:', error.message);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'Image size must not exceed 5 MB.'
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      message: 'Unexpected image upload field.'
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      message: 'Image upload failed. Please check the selected file.'
    });
  }

  if (error.message === 'Only JPG, PNG and WEBP images are allowed.') {
    return res.status(400).json({
      message: error.message
    });
  }

  if (error.message === 'This origin is not allowed by CORS.') {
    return res.status(403).json({
      message: error.message
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      message: 'Invalid JSON request body.'
    });
  }

  res.status(error.status || 500).json({
    message: error.status && error.status < 500
      ? error.message
      : 'Something went wrong. Please try again.'
  });
});

// Connect to MongoDB before accepting requests.
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully!');

    app.listen(PORT, () => {
      console.log(`CiviSynq Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  });
