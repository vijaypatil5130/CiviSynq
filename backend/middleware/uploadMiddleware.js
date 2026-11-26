
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDirectory = path.join(__dirname, '../uploads');

fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedExtensions = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = file.mimetype === 'image/jpeg'
      ? '.jpg'
      : file.mimetype === 'image/png'
        ? '.png'
        : '.webp';

    const uniqueName =
      Date.now() + '-' + crypto.randomBytes(12).toString('hex');

    cb(null, uniqueName + extension);
  }
});

const fileFilter = (req, file, cb) => {
  const extensions = allowedExtensions[file.mimetype];
  const originalExtension = path.extname(file.originalname).toLowerCase();

  if (!extensions || !extensions.includes(originalExtension)) {
    return cb(
      new Error('Only JPG, PNG and WEBP images are allowed.')
    );
  }

  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
});
