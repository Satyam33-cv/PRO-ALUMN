// apps/api/src/routes/uploads.js
// File uploads (resumes): Cloudinary if configured, otherwise local disk
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const PUBLIC_UPLOAD_DIR = '/uploads';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).slice(1) || 'bin';
    cb(null, `${crypto.randomBytes(8).toString('hex')}-${Date.now()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = Boolean(ALLOWED[file.mimetype]);
    cb(ok ? null : new Error('Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, WEBP'), ok);
  },
});

const cloudinary = require('cloudinary').v2;
const cloudConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (cloudConfigured) cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function baseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

// =================== POST /api/uploads/resume ===================
router.post('/resume', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: file)' });

    let url;
    if (cloudConfigured) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'pro-alumn/resumes',
        resource_type: 'auto',
      });
      fs.unlink(req.file.path, () => {});
      url = result.secure_url;
    } else {
      url = `${baseUrl(req)}${PUBLIC_UPLOAD_DIR}/${req.file.filename}`;
    }

    res.status(201).json({ url, filename: req.file.originalname });
  } catch (err) {
    console.error('POST /uploads/resume error:', err);
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    res.status(err.message === 'Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, JPG, PNG, WEBP'
      ? 400
      : 500).json({ error: err.message || 'Failed to upload file' });
  }
});

module.exports = router;
