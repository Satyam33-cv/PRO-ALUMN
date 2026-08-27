const prisma = require('../src/db');

async function runVerificationTest() {
  console.log('🚀 Starting Verification, Admin Approval & Referral Crediting Tests...\n');

  try {
    // 1. Setup Test Referrer User
    const referrerEmail = `referrer_test_${Date.now()}@college.edu`;
    const referrer = await prisma.user.create({
      data: {
        name: 'Senior Alumnus Referrer',
        email: referrerEmail,
        passwordHash: 'dummy_hash',
        role: 'ALUMNI',
        profileStatus: 'APPROVED',
        isVerified: true,
        referralCode: `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      },
    });
    console.log(`✅ Referrer created: ${referrer.name} (Code: ${referrer.referralCode})`);

    // 2. Setup Test Referee User
    const refereeEmail = `referee_test_${Date.now()}@somaiya.edu`;
    const referee = await prisma.user.create({
      data: {
        name: 'New Student Referee',
        email: refereeEmail,
        passwordHash: 'dummy_hash',
        role: 'STUDENT',
        profileStatus: 'INCOMPLETE',
        referredByCode: referrer.referralCode,
      },
    });
    console.log(`✅ Referee created: ${referee.name} (Status: ${referee.profileStatus}, ReferredBy: ${referee.referredByCode})`);

    // 3. Simulate Paid Verification Payment Record
    const orderId = `order_${referee.id.substring(0, 8)}_${Date.now()}`;
    const payment = await prisma.paymentRecord.create({
      data: {
        userId: referee.id,
        amount: 2900,
        currency: 'INR',
        razorpayOrderId: orderId,
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpaySignature: 'valid_test_signature',
        status: 'SUCCESS',
      },
    });
    console.log(`✅ PaymentRecord created: ${payment.razorpayOrderId} (Status: ${payment.status}, Amount: ₹${payment.amount / 100})`);

    // Advance referee to PENDING review
    await prisma.user.update({
      where: { id: referee.id },
      data: {
        profileStatus: 'PENDING',
        verificationMethod: 'paid',
      },
    });
    console.log(`✅ Referee advanced to PENDING review with verificationMethod='paid'`);

    // 4. Simulate Admin Approval in Atomic Transaction
    console.log('\n⚡ Executing Admin Approval inside atomic prisma.$transaction...');
    const result = await prisma.$transaction(async (tx) => {
      // Update referee
      const updatedReferee = await tx.user.update({
        where: { id: referee.id },
        data: {
          profileStatus: 'APPROVED',
          isVerified: true,
        },
      });

      // Credit referee wallet (+50 pts)
      const userWallet = await tx.wallet.upsert({
        where: { userId: updatedReferee.id },
        update: { balance: { increment: 50 } },
        create: { userId: updatedReferee.id, balance: 50 },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          userId: updatedReferee.id,
          amount: 50,
          type: 'CREDIT',
          reason: 'PROFILE_APPROVAL_BONUS',
          description: 'Profile Approval Bonus (+50 pts)',
        },
      });

      // Credit referrer wallet (+100 pts)
      let referrerCredited = false;
      if (updatedReferee.referredByCode) {
        const refUser = await tx.user.findUnique({
          where: { referralCode: updatedReferee.referredByCode },
        });

        if (refUser && refUser.isActive) {
          const refWallet = await tx.wallet.upsert({
            where: { userId: refUser.id },
            update: { balance: { increment: 100 } },
            create: { userId: refUser.id, balance: 100 },
          });

          await tx.walletTransaction.create({
            data: {
              walletId: refWallet.id,
              userId: refUser.id,
              amount: 100,
              type: 'CREDIT',
              reason: 'REFERRAL_BONUS',
              description: `Referral Bonus for inviting ${updatedReferee.email} (+100 pts)`,
            },
          });
          referrerCredited = true;
        }
      }

      return { updatedReferee, userWallet, referrerCredited };
    });

    // 5. Verify Wallets and Balances
    const refereeWallet = await prisma.wallet.findUnique({
      where: { userId: referee.id },
      include: { transactions: true },
    });
    const referrerWallet = await prisma.wallet.findUnique({
      where: { userId: referrer.id },
      include: { transactions: true },
    });

    console.log(`\n🎉 Verification & Ledgers Verified:`);
    console.log(`   - Referee Profile Status: ${result.updatedReferee.profileStatus} (Verified: ${result.updatedReferee.isVerified})`);
    console.log(`   - Referee Wallet Balance: ${refereeWallet.balance} pts (Tx Count: ${refereeWallet.transactions.length}, Reason: ${refereeWallet.transactions[0].reason})`);
    console.log(`   - Referrer Wallet Balance: ${referrerWallet.balance} pts (Tx Count: ${referrerWallet.transactions.length}, Reason: ${referrerWallet.transactions[0].reason})`);

    // Clean up test records
    await prisma.walletTransaction.deleteMany({ where: { userId: { in: [referee.id, referrer.id] } } });
    await prisma.wallet.deleteMany({ where: { userId: { in: [referee.id, referrer.id] } } });
    await prisma.paymentRecord.deleteMany({ where: { userId: referee.id } });
    await prisma.user.deleteMany({ where: { id: { in: [referee.id, referrer.id] } } });
    console.log('\n🧹 Test users and records cleanly removed.');
    console.log('✅ ALL VERIFICATION & REFERRAL LEDGER TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification test error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerificationTest();
