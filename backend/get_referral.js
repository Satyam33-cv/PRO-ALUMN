const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst();
  if (user) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: 'TESTREF123' }
    });
    console.log(`Referral code generated for ${updatedUser.email}: TESTREF123`);
  } else {
    console.log("No users found to attach a referral code to.");
  }
}
main().finally(() => process.exit(0));
