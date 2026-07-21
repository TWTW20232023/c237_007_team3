const multer = require('multer');

// Memory storage, NOT disk storage. Render's filesystem is ephemeral -
// anything saved to disk gets wiped on restart/redeploy. Since the image
// ends up stored directly in the book_images table (LONGBLOB), we only
// need the file held in memory momentarily before writing it to MySQL.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

module.exports = upload;
