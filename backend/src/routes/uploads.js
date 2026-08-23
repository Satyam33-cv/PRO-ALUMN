// apps/api/src/routes/uploads.js
// Supabase Cloud Storage upload endpoints for avatars, resumes, certificates, and stories
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { uploadToStorage, supabase } = require('../services/supabase');

// Use memory storage for direct streaming to Supabase Storage, or disk fallback
const storage = multer.memoryStorage();

const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
];

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, Word, JPG, PNG, WEBP, or MP4.'));
    }
  },
});

function getExtension(filename, mimetype) {
  const ext = path.extname(filename).slice(1);
  if (ext) return ext;
  if (mimetype.includes('pdf')) return 'pdf';
  if (mimetype.includes('png')) return 'png';
  if (mimetype.includes('jpeg') || mimetype.includes('jpg')) return 'jpg';
  if (mimetype.includes('webp')) return 'webp';
  return 'bin';
}

// =================== POST /api/uploads/media ===================
// Generic multi-bucket uploader to Supabase
router.post('/media', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided (form field: file)' });
    }

    const bucket = req.body.bucket || req.query.bucket || 'documents';
    const ext = getExtension(req.file.originalname, req.file.mimetype);
    const fileName = `${req.user.id}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

    let url;
    if (supabase) {
      url = await uploadToStorage(bucket, fileName, req.file.buffer, req.file.mimetype);
    } else {
      // Local fallback
      const uploadDir = path.join(__dirname, '..', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, `${Date.now()}-${ext}`);
      fs.writeFileSync(localPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${path.basename(localPath)}`;
    }

    res.status(201).json({
      url,
      bucket,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    console.error('POST /uploads/media error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload media to Supabase' });
  }
});

// =================== POST /api/uploads/avatar ===================
// Upload profile photo directly to Supabase 'avatars' bucket & update user profile
router.post('/avatar', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar image uploaded' });
    }

    const ext = getExtension(req.file.originalname, req.file.mimetype);
    const fileName = `avatar-${req.user.id}-${Date.now()}.${ext}`;

    let url;
    if (supabase) {
      url = await uploadToStorage('avatars', fileName, req.file.buffer, req.file.mimetype);
    } else {
      const uploadDir = path.join(__dirname, '..', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, fileName);
      fs.writeFileSync(localPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    }

    // Update user profile in database
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: url, lastProfileUpdate: new Date() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        department: true,
        batchYear: true,
        currentCompany: true,
        jobTitle: true,
      },
    });

    const { awardPoints } = require('../services/gamification');
    await awardPoints(req.user.id, 'PROFILE_PHOTO_UPDATED', 25).catch(() => {});

    res.status(200).json({
      url,
      user: updatedUser,
      message: 'Profile photo updated successfully and publicly viewable!',
    });
  } catch (err) {
    console.error('POST /uploads/avatar error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload avatar' });
  }
});

// =================== POST /api/uploads/resume ===================
// Upload resume to Supabase 'resumes' bucket
router.post('/resume', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const ext = getExtension(req.file.originalname, req.file.mimetype);
    const fileName = `resume-${req.user.id}-${Date.now()}.${ext}`;

    let url;
    if (supabase) {
      url = await uploadToStorage('resumes', fileName, req.file.buffer, req.file.mimetype);
    } else {
      const uploadDir = path.join(__dirname, '..', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, fileName);
      fs.writeFileSync(localPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    }

    // Update user profile with resume URL
    await prisma.user.update({
      where: { id: req.user.id },
      data: { resumeUrl: url, lastProfileUpdate: new Date() },
    });

    const { awardPoints } = require('../services/gamification');
    await awardPoints(req.user.id, 'RESUME_UPLOADED', 30).catch(() => {});

    res.status(201).json({
      url,
      filename: req.file.originalname,
      message: 'Resume saved to Supabase storage successfully!',
    });
  } catch (err) {
    console.error('POST /uploads/resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload resume' });
  }
});

// =================== POST /api/uploads/certificate ===================
// Upload experience certificate or proof document to 'certificates' bucket
router.post('/certificate', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No certificate/document provided' });
    }

    const ext = getExtension(req.file.originalname, req.file.mimetype);
    const fileName = `cert-${req.user.id}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;

    let url;
    if (supabase) {
      url = await uploadToStorage('certificates', fileName, req.file.buffer, req.file.mimetype);
    } else {
      const uploadDir = path.join(__dirname, '..', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, fileName);
      fs.writeFileSync(localPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    }

    const { awardPoints } = require('../services/gamification');
    await awardPoints(req.user.id, 'CERTIFICATE_UPLOADED', 40).catch(() => {});

    res.status(201).json({
      url,
      filename: req.file.originalname,
      message: 'Experience certificate/proof uploaded to Supabase!',
    });
  } catch (err) {
    console.error('POST /uploads/certificate error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload certificate' });
  }
});

module.exports = router;
