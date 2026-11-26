
const multer = require('multer');
const path = require('path');

const allowedExtensions = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extensions = allowedExtensions[file.mimetype];
  const originalExtension = path.extname(file.originalname).toLowerCase();

  if (!extensions || !extensions.includes(originalExtension)) {
    return cb(new Error('Only JPG, PNG and WEBP images are allowed.'));
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
