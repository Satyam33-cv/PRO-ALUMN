const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

// =================== VIDEO MARKETPLACE ENDPOINTS ===================

// GET /api/video
// List all videos
router.get('/', async (req, res) => {
  try {
    const videos = await prisma.video.findMany({
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            currentCompany: true,
            batchYear: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ videos });
  } catch (error) {
    console.error('[Video List Error]', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// POST /api/video
// Upload/submit new education video
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, videoUrl, priceInCredits } = req.body;
    if (!title || !description || !videoUrl) {
      return res.status(400).json({ error: 'Missing required fields: title, description, videoUrl' });
    }

    const video = await prisma.video.create({
      data: {
        title,
        description,
        videoUrl,
        priceInCredits: typeof priceInCredits === 'number' ? priceInCredits : 0,
        status: 'PROCESSING',
        uploaderId: req.user.id,
      },
    });

    res.status(201).json({ success: true, video });
  } catch (error) {
    console.error('[Video Submit Error]', error);
    res.status(500).json({ error: 'Failed to submit video' });
  }
});

// POST /api/video/:id/unlock
// Unlock video using wallet credits
router.post('/:id/unlock', authenticate, async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) return res.status(404).json({ error: 'Video not found' });

    if (video.priceInCredits === 0) {
      await prisma.unlockedVideo.upsert({
        where: { userId_videoId: { userId: req.user.id, videoId } },
        create: { userId: req.user.id, videoId },
        update: {},
      });
      return res.json({ success: true });
    }

    const result = await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: req.user.id, balance: 0 } });
      }

      if (wallet.balance < video.priceInCredits) {
        throw new Error('Insufficient points to unlock this video.');
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: video.priceInCredits } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user.id,
          amount: video.priceInCredits,
          type: 'DEBIT',
          reason: 'VIDEO_UNLOCK',
          description: `Unlocked premium video: ${video.title}`,
        },
      });

      await tx.unlockedVideo.upsert({
        where: { userId_videoId: { userId: req.user.id, videoId } },
        create: { userId: req.user.id, videoId },
        update: {},
      });

      return { success: true };
    });

    res.json(result);
  } catch (error) {
    console.error('[Video Unlock Error]', error);
    res.status(400).json({ error: error.message || 'Failed to unlock video' });
  }
});

// POST /api/video/heartbeat
// Anti-cheat heartbeat tracker for Watch-to-Earn
router.post('/heartbeat', authenticate, async (req, res) => {
  try {
    const { videoId, currentTimestamp } = req.body;

    if (!videoId || typeof currentTimestamp !== 'number') {
      return res.status(400).json({ error: 'videoId and currentTimestamp are required' });
    }

    // Find the video to get its duration
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { id: true, duration: true }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Default duration to 300s (5 mins) if not set in DB for some reason, to prevent division by zero
    const durationStr = video.duration || '5:00';
    const timeParts = durationStr.split(':').map(Number);
    const durationSeconds = timeParts.length === 2 
      ? (timeParts[0] * 60 + timeParts[1]) 
      : (timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]);

    // Upsert the watch session
    let session = await prisma.watchSession.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId } }
    });

    if (!session) {
      session = await prisma.watchSession.create({
        data: {
          userId: req.user.id,
          videoId,
          maxWatchedTimestamp: currentTimestamp,
          lastHeartbeat: new Date(),
          status: 'WATCHING'
        }
      });
    } else {
      // Anti-cheat: Ensure they didn't skip ahead too fast
      const now = new Date();
      const serverTimePassedSec = (now.getTime() - session.lastHeartbeat.getTime()) / 1000;
      const timestampJump = currentTimestamp - session.maxWatchedTimestamp;

      // Allow a buffer (e.g., buffering, lag, seeking back). 
      // If they jumped forward significantly faster than server time passed, it's a cheat.
      if (timestampJump > 10 && timestampJump > serverTimePassedSec + 5) {
        // Log potential cheat, but for hackathon we just cap the jump
        // They can't jump ahead faster than real-time + 5s buffer
        return res.status(429).json({ error: 'Invalid watch speed detected. Please watch at 1x speed.' });
      }

      // Update session
      session = await prisma.watchSession.update({
        where: { id: session.id },
        data: {
          maxWatchedTimestamp: Math.max(session.maxWatchedTimestamp, currentTimestamp),
          lastHeartbeat: now
        }
      });
    }

    // Check completion (90% watched)
    const watchPercentage = (session.maxWatchedTimestamp / durationSeconds) * 100;
    
    if (watchPercentage >= 90 && session.status !== 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        // Mark as completed
        await tx.watchSession.update({
          where: { id: session.id },
          data: { status: 'COMPLETED' }
        });

        // Grant 100 Credits
        const earnedPoints = 100;
        
        let wallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId: req.user.id, balance: 0 } });
        }

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: earnedPoints } }
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: req.user.id,
            amount: earnedPoints,
            type: 'VIDEO_COMPLETED',
            description: `Earned for watching video`,
          }
        });
      });

      return res.json({ message: 'Heartbeat recorded. Video completed! +100 Credits', isCompleted: true, watchPercentage });
    }

    res.json({ message: 'Heartbeat recorded', isCompleted: session.status === 'COMPLETED', watchPercentage });
  } catch (error) {
    console.error('[Video Heartbeat Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/video/claim-certificate
// Claims a certificate after completing a video and deducts a fee
router.post('/claim-certificate', authenticate, async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({ error: 'videoId is required' });
    }

    // Base fee is 15 credits
    const deductionFee = 15;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify session is COMPLETED
      const session = await tx.watchSession.findUnique({
        where: { userId_videoId: { userId: req.user.id, videoId } }
      });

      if (!session || session.status !== 'COMPLETED') {
        throw new Error("You must finish watching the video before claiming a certificate.");
      }

      // 2. Ensure they haven't already claimed it
      const existingCert = await tx.certificate.findUnique({
        where: { userId_videoId: { userId: req.user.id, videoId } }
      });

      if (existingCert) {
        throw new Error("Certificate already claimed for this video.");
      }

      // 3. Check wallet balance and deduct fee
      const wallet = await tx.wallet.findUnique({
        where: { userId: req.user.id }
      });

      if (!wallet || wallet.balance < deductionFee) {
        throw new Error(`Insufficient credits to claim certificate. Requires ${deductionFee} credits.`);
      }

      await tx.wallet.update({
        where: { userId: req.user.id },
        data: { balance: { decrement: deductionFee } }
      });

      // 4. Log transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: req.user.id,
          amount: -deductionFee,
          type: 'CERTIFICATE_CLAIM',
          description: `Claimed certificate for video`
        }
      });

      // 5. Mock PDF URL for hackathon
      const mockPdfUrl = `https://sihproalumn.vercel.app/certificates/${req.user.id}-${videoId}.pdf`;

      // 6. Create Certificate record
      return tx.certificate.create({
        data: {
          userId: req.user.id,
          videoId,
          pointsDeducted: deductionFee,
          certificateUrl: mockPdfUrl
        }
      });
    });

    res.json({ message: 'Certificate claimed successfully', certificate: result });
  } catch (error) {
    console.error('[Claim Certificate Error]', error);
    res.status(400).json({ error: error.message || 'Failed to claim certificate' });
  }
});

// GET /api/video/:videoId/progress
// Fetch user's current progress on a video
router.get('/:videoId/progress', authenticate, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const session = await prisma.watchSession.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId } }
    });
    
    const certificate = await prisma.certificate.findUnique({
      where: { userId_videoId: { userId: req.user.id, videoId } }
    });

    res.json({
      maxWatchedTimestamp: session?.maxWatchedTimestamp || 0,
      status: session?.status || 'NOT_STARTED',
      hasCertificate: !!certificate,
      certificateUrl: certificate?.certificateUrl
    });
  } catch (error) {
    console.error('[Video Progress Error]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
