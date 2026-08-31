const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

// =================== GET /api/mentorship ===================
// List mentorship requests for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const isMentor = req.user.role === 'ALUMNI' || req.user.role === 'FACULTY';
    const where = isMentor ? { mentorId: req.user.id } : { studentId: req.user.id };

    const mentorships = await prisma.mentorship.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, avatarUrl: true, department: true, batchYear: true, skillsOffered: true, skillsWanted: true },
        },
        mentor: {
          select: { id: true, name: true, avatarUrl: true, currentCompany: true, jobTitle: true, skillsOffered: true, skillsWanted: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ mentorships });
  } catch (err) {
    console.error('GET /mentorship error:', err);
    res.status(500).json({ error: 'Failed to fetch mentorship requests' });
  }
});

// =================== POST /api/mentorship ===================
// Request mentorship (supports both Credit Swap and Direct Swap)
router.post('/', authenticate, async (req, res) => {
  try {
    const { mentorId, area, message, isDirectSwap = false, scheduledFor, durationMins = 60 } = req.body;
    
    // For direct swap, credits are always 0. For credit swap, default 50.
    const creditsCharged = isDirectSwap ? 0 : (req.body.creditsCharged ?? 50);

    if (!mentorId || !area) {
      return res.status(400).json({ error: 'mentorId and area are required' });
    }

    if (req.user.id === mentorId) {
      return res.status(400).json({ error: 'Cannot request mentorship from yourself' });
    }

    // Check if a request already exists between these users
    const existing = await prisma.mentorship.findFirst({
      where: {
        studentId: req.user.id,
        mentorId: mentorId,
        status: { notIn: ['COMPLETED', 'DECLINED', 'DISPUTED'] }
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'An active mentorship request already exists with this mentor' });
    }

    // Check if this is one of their first 3 free passes
    const pastRequestsCount = await prisma.mentorship.count({
      where: { studentId: req.user.id }
    });
    
    // If they have less than 3 past requests, the platform subsidizes the cost (student pays 0)
    const isFreePass = pastRequestsCount < 3 && !isDirectSwap;
    const actualStudentDeduction = isFreePass ? 0 : creditsCharged;

    // Check Wallet Balance & Process Escrow using Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Only deduct credits if it's not a free pass and not a direct swap
      if (actualStudentDeduction > 0) {
        // 1. Get student wallet
        const studentWallet = await tx.wallet.findUnique({
          where: { userId: req.user.id }
        });
        
        if (!studentWallet || studentWallet.balance < actualStudentDeduction) {
          throw new Error('Insufficient credits for this mentorship request.');
        }

        // 2. Deduct from student wallet
        await tx.wallet.update({
          where: { userId: req.user.id },
          data: { balance: { decrement: actualStudentDeduction } }
        });

        // 3. Create Escrow Ledger
        await tx.walletTransaction.create({
          data: {
            walletId: studentWallet.id,
            userId: req.user.id,
            amount: -actualStudentDeduction,
            type: 'MENTORSHIP_ESCROW',
            description: `Escrow for mentorship with mentor ID: ${mentorId}`,
          }
        });
      }

      // If it's a free pass, log a credit transaction to show the platform subsidy
      if (isFreePass && creditsCharged > 0) {
        let studentWallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
        if (!studentWallet) {
          studentWallet = await tx.wallet.create({ data: { userId: req.user.id, balance: 0 } });
        }
        await tx.walletTransaction.create({
          data: {
            walletId: studentWallet.id,
            userId: req.user.id,
            amount: 0,
            type: 'CREDIT',
            description: `First 3 Free Passes: Platform subsidized ${creditsCharged} pts for this mentorship.`,
          }
        });
      }

      // 4. Create Mentorship Request
      return tx.mentorship.create({
        data: {
          studentId: req.user.id,
          mentorId,
          area,
          message,
          creditsCharged,
          isDirectSwap,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          durationMins,
          status: 'PENDING',
        },
      });
    });

    res.status(201).json({ mentorship: result });
  } catch (err) {
    console.error('POST /mentorship error:', err);
    res.status(400).json({ error: err.message || 'Failed to request mentorship' });
  }
});

// =================== PATCH /api/mentorship/:id/status ===================
// Update mentorship status (Mentor/Student)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, grantVideoAccess } = req.body; // 'ACCEPTED', 'DECLINED', 'COMPLETED', 'DISPUTED'
    if (!['ACCEPTED', 'DECLINED', 'COMPLETED', 'DISPUTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const mentorship = await prisma.mentorship.findUnique({
      where: { id: req.params.id },
      include: { student: true, mentor: true }
    });

    if (!mentorship) return res.status(404).json({ error: 'Mentorship request not found' });
    
    // Authorization: only involved parties can act
    const isInvolved = mentorship.mentorId === req.user.id || mentorship.studentId === req.user.id;
    if (!isInvolved) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Only mentor can accept/decline
    if ((status === 'ACCEPTED' || status === 'DECLINED') && mentorship.mentorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the mentor can accept or decline' });
    }
    
    if (mentorship.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Mentorship is already completed' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      let chatThreadId = mentorship.chatThreadId;
      
      // If ACCEPTED, create Chat Thread and release credits (for credit swaps)
      if (status === 'ACCEPTED' && !chatThreadId) {
        const thread = await tx.chatThread.create({
          data: {
            name: `${mentorship.isDirectSwap ? 'Skill Swap' : 'Mentorship'}: ${mentorship.area}`,
            isGroup: false,
            members: {
              create: [
                { userId: mentorship.mentorId },
                { userId: mentorship.studentId }
              ]
            }
          }
        });
        chatThreadId = thread.id;

        // Release Escrow to Mentor automatically upon acceptance (credit swap only)
        if (mentorship.creditsCharged > 0 && !mentorship.isCompleted) {
          await tx.wallet.update({
            where: { userId: mentorship.mentorId },
            data: { balance: { increment: mentorship.creditsCharged } }
          });
          
          const mentorWallet = await tx.wallet.findUnique({ where: { userId: mentorship.mentorId }});
          await tx.walletTransaction.create({
            data: {
              walletId: mentorWallet.id,
              userId: mentorship.mentorId,
              amount: mentorship.creditsCharged,
              type: 'MENTORSHIP_EARNED',
              description: `Earned from ${mentorship.isDirectSwap ? 'skill swap' : 'mentorship'} with ${mentorship.student.name}`,
            }
          });
        }
        // Optional: Mentor grants video access to the student
        if (grantVideoAccess) {
          const mentorVideos = await tx.video.findMany({
            where: { uploaderId: mentorship.mentorId, status: 'APPROVED' },
            select: { id: true },
          });
          for (const v of mentorVideos) {
            await tx.unlockedVideo.upsert({
              where: { userId_videoId: { userId: mentorship.studentId, videoId: v.id } },
              create: { userId: mentorship.studentId, videoId: v.id },
              update: {},
            });
          }
        }
      }
      
      // If DECLINED, refund the Escrow (but only if the student actually paid for it)
      if (status === 'DECLINED' && mentorship.creditsCharged > 0 && mentorship.status === 'PENDING') {
        const pastRequestsCountAtDecline = await tx.mentorship.count({
          where: { studentId: mentorship.studentId, createdAt: { lt: mentorship.createdAt } }
        });
        const wasFreePass = pastRequestsCountAtDecline < 3 && !mentorship.isDirectSwap;
        const actualStudentDeductionAtDecline = wasFreePass ? 0 : mentorship.creditsCharged;

        if (actualStudentDeductionAtDecline > 0) {
          await tx.wallet.update({
            where: { userId: mentorship.studentId },
            data: { balance: { increment: actualStudentDeductionAtDecline } }
          });
          
          const studentWallet = await tx.wallet.findUnique({ where: { userId: mentorship.studentId }});
          await tx.walletTransaction.create({
            data: {
              walletId: studentWallet.id,
              userId: mentorship.studentId,
              amount: actualStudentDeductionAtDecline,
              type: 'ESCROW_REFUND',
              description: `Refund for declined mentorship`,
            }
          });
        }
      }

      // If DISPUTED, freeze everything — admin will review
      // Credits stay where they are (already released or still in escrow depending on state)

      return tx.mentorship.update({
        where: { id: req.params.id },
        data: { 
          status,
          chatThreadId,
          isCompleted: status === 'ACCEPTED' || status === 'COMPLETED' ? true : mentorship.isCompleted
        },
      });
    });

    res.json({ mentorship: updated });
  } catch (err) {
    console.error('PATCH /mentorship/:id/status error:', err);
    res.status(500).json({ error: err.message || 'Failed to update mentorship status' });
  }
});

// =================== PATCH /api/mentorship/:id/confirm ===================
// Dual-handshake confirmation: each party confirms the session happened
router.patch('/:id/confirm', authenticate, async (req, res) => {
  try {
    const mentorship = await prisma.mentorship.findUnique({
      where: { id: req.params.id },
      include: { student: true, mentor: true }
    });

    if (!mentorship) return res.status(404).json({ error: 'Mentorship not found' });

    if (mentorship.status !== 'ACCEPTED') {
      return res.status(400).json({ error: 'Can only confirm an accepted mentorship session' });
    }

    const isStudent = mentorship.studentId === req.user.id;
    const isMentor = mentorship.mentorId === req.user.id;

    if (!isStudent && !isMentor) {
      return res.status(403).json({ error: 'You are not part of this mentorship' });
    }

    // Update confirmation flags
    const updateData = {};
    if (isStudent) updateData.studentConfirmed = true;
    if (isMentor) updateData.mentorConfirmed = true;

    // Determine if both have now confirmed
    const bothConfirmed =
      (isStudent ? true : mentorship.studentConfirmed) &&
      (isMentor ? true : mentorship.mentorConfirmed);

    if (bothConfirmed) {
      updateData.status = 'COMPLETED';
      updateData.isCompleted = true;
    }

    const updated = await prisma.mentorship.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      mentorship: updated,
      message: bothConfirmed
        ? 'Both parties confirmed — session marked as completed!'
        : `Your confirmation recorded. Waiting for ${isStudent ? 'mentor' : 'student'} to confirm.`,
    });
  } catch (err) {
    console.error('PATCH /mentorship/:id/confirm error:', err);
    res.status(500).json({ error: 'Failed to confirm session' });
  }
});

module.exports = router;
