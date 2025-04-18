const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Eğer 'uploads' klasörü yoksa oluştur
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Dosya ismini eşsiz yap
  },
});

const upload = multer({ storage });

module.exports = upload;
