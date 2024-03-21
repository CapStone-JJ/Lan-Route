const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Dynamic destination to create directories if they don't exist
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const dirType = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    const dest = path.join(__dirname, 'uploads', dirType);
    fs.mkdirSync(dest, { recursive: true }); // Ensure the directory exists
    cb(null, dest);
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

module.exports = upload;

