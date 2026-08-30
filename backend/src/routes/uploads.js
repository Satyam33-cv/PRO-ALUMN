// apps/api/src/routes/uploads.js
// Supabase Cloud Storage upload endpoints with data protection, path isolation, and signed URLs
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { uploadToStorage, createSignedUrl, supabase } = require('../services/supabase');

const storage = multer.memoryStorage();

const RESUME_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MEDIA_MIME = [
  ...IMAGE_MIME,
  ...RESUME_MIME,
  'image/gif',
  'video/mp4',
];

const uploadMedia = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (MEDIA_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format. Please upload PDF, Word, JPG, PNG, WEBP, or MP4.'));
    }
  },
});

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (IMAGE_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed for avatars.'));
    }
  },
});

const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (RESUME_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or Word documents (.pdf, .doc, .docx) are allowed for resumes.'));
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
router.post('/media', authenticate, uploadMedia.single('file'), async (req, res) => {
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
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Cloud storage is required in production environments.' });
      }
      const uploadDir = path.join(__dirname, '..', 'uploads', req.user.id);
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, `${Date.now()}-${ext}`);
      fs.writeFileSync(localPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${req.user.id}/${path.basename(localPath)}`;
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
router.post('/avatar', authenticate, uploadAvatar.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No avatar image uploaded' });
    }

    const ext = getExtension(req.file.originalname, req.file.mimetype);
    const fileName = `${req.user.id}/avatar-${Date.now()}.${ext}`;

    let url;
    if (supabase) {
      url = await uploadToStorage('avatars', fileName, req.file.buffer, req.file.mimetype);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Cloud storage is required in production environments.' });
      }
      const uploadDir = path.join(__dirname, '..', 'uploads', req.user.id);
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, `avatar-${Date.now()}.${ext}`);
      fs.writeFileSync(localPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${req.user.id}/${path.basename(localPath)}`;
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
      message: 'Profile photo updated successfully!',
    });
  } catch (err) {
    console.error('POST /uploads/avatar error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload avatar' });
  }
});

// =================== POST /api/uploads/resume ===================
// Uploads to private 'resumes' bucket with path isolation by user ID
router.post('/resume', authenticate, uploadResume.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    const ext = getExtension(req.file.originalname, req.file.mimetype);
    const fileName = `${req.user.id}/resume-${Date.now()}.${ext}`;

    let storedPath;
    if (supabase) {
      storedPath = await uploadToStorage('resumes', fileName, req.file.buffer, req.file.mimetype);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Cloud storage is required in production environments.' });
      }
      const uploadDir = path.join(__dirname, '..', 'uploads', req.user.id);
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, `resume-${Date.now()}.${ext}`);
      fs.writeFileSync(localPath, req.file.buffer);
      storedPath = `${req.protocol}://${req.get('host')}/uploads/${req.user.id}/${path.basename(localPath)}`;
    }

    // Update user profile with private storage reference
    await prisma.user.update({
      where: { id: req.user.id },
      data: { resumeUrl: storedPath, lastProfileUpdate: new Date() },
    });

    const { awardPoints } = require('../services/gamification');
    await awardPoints(req.user.id, 'RESUME_UPLOADED', 30).catch(() => {});

    res.status(201).json({
      url: storedPath,
      filename: req.file.originalname,
      message: 'Resume securely stored in private cloud storage!',
    });
  } catch (err) {
    console.error('POST /uploads/resume error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload resume' });
  }
});

// =================== GET /api/uploads/resume/signed-url ===================
// Generates a short-lived signed URL for authorized access to a resume
router.get('/resume/signed-url', authenticate, async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.user.id;

    // RBAC: A student can view their own resume. An ALUMNI or ADMIN can view an applicant's resume.
    if (targetUserId !== req.user.id && req.user.role !== 'ADMIN') {
      // If requester is an ALUMNI, verify that targetUserId has applied to one of their posted jobs
      const applicantRef = await prisma.referralRequest.findFirst({
        where: {
          requestedById: targetUserId,
          job: { postedById: req.user.id },
        },
      });

      if (!applicantRef) {
        return res.status(403).json({ error: 'Access denied: You do not have permission to view this candidate resume.' });
      }
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { resumeUrl: true },
    });

    if (!targetUser || !targetUser.resumeUrl) {
      return res.status(404).json({ error: 'Resume not found for this member.' });
    }

    // If stored as supabase path or URL
    if (supabase && targetUser.resumeUrl.startsWith('supabase://resumes/')) {
      const filePath = targetUser.resumeUrl.replace('supabase://resumes/', '');
      const signedUrl = await createSignedUrl('resumes', filePath, 300); // 5 minutes validity
      return res.json({ signedUrl, expiresIn: 300 });
    }

    // Return the URL directly if external or fallback
    return res.json({ signedUrl: targetUser.resumeUrl, expiresIn: 300 });
  } catch (err) {
    console.error('GET /uploads/resume/signed-url error:', err);
    res.status(500).json({ error: 'Failed to generate secure resume link' });
  }
});

// =================== POST /api/uploads/certificate ===================
router.post('/certificate', authenticate, uploadResume.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No certificate/document provided' });
    }

    const ext = getExtension(req.file.originalname, req.file.mimetype);
    const fileName = `${req.user.id}/cert-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;

    let url;
    if (supabase) {
      url = await uploadToStorage('certificates', fileName, req.file.buffer, req.file.mimetype);
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Cloud storage is required in production environments.' });
      }
      const uploadDir = path.join(__dirname, '..', 'uploads', req.user.id);
      fs.mkdirSync(uploadDir, { recursive: true });
      const localPath = path.join(uploadDir, path.basename(fileName));
      fs.writeFileSync(localPath, req.file.buffer);
      url = `${req.protocol}://${req.get('host')}/uploads/${req.user.id}/${path.basename(localPath)}`;
    }

    const { awardPoints } = require('../services/gamification');
    await awardPoints(req.user.id, 'CERTIFICATE_UPLOADED', 40).catch(() => {});

    res.status(201).json({
      url,
      filename: req.file.originalname,
      message: 'Experience certificate/proof uploaded securely!',
    });
  } catch (err) {
    console.error('POST /uploads/certificate error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload certificate' });
  }
});

module.exports = router;
