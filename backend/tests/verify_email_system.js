const assert = require('assert');
const emailUtil = require('../src/utils/email');

async function runTests() {
  console.log('--- TEST 1: Check Exported Functions ---');
  assert.strictEqual(typeof emailUtil.sendEmail, 'function', 'sendEmail must be a function');
  assert.strictEqual(typeof emailUtil.sendProfileApprovalEmail, 'function', 'sendProfileApprovalEmail must be a function');
  assert.strictEqual(typeof emailUtil.sendAchievementApprovalEmail, 'function', 'sendAchievementApprovalEmail must be a function');
  assert.strictEqual(typeof emailUtil.sendSupportTicketConfirmation, 'function', 'sendSupportTicketConfirmation must be a function');
  assert.strictEqual(typeof emailUtil.sendAdminTicketNotification, 'function', 'sendAdminTicketNotification must be a function');
  console.log('✓ All 5 email functions exported properly.');

  console.log('\n--- TEST 2: Guard Missing Recipient ---');
  const resMissing = await emailUtil.sendEmail(null, 'Test', '<p>Test</p>');
  assert.strictEqual(resMissing.success, false);
  assert.strictEqual(resMissing.reason, 'missing_recipient');
  console.log('✓ Handled missing recipient safely.');

  console.log('\n--- TEST 3: Fallback Mode (No Credentials) ---');
  const savedResendKey = process.env.RESEND_API_KEY;
  const savedUser = process.env.EMAIL_USER;
  const savedPass = process.env.EMAIL_APP_PASSWORD;

  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_APP_PASSWORD;

  // Re-require to test without Resend instance
  delete require.cache[require.resolve('../src/utils/email')];
  const freshEmailUtil = require('../src/utils/email');

  const resFallback = await freshEmailUtil.sendEmail('test@example.com', 'Test Subject', '<p>Hello</p>');
  assert.strictEqual(resFallback.success, false);
  assert.strictEqual(resFallback.reason, 'no_credentials_configured');
  console.log('✓ Graceful mock fallback verified when no credentials configured.');

  console.log('\n--- TEST 4: Email Template Execution in Fallback Mode ---');
  const p1 = await freshEmailUtil.sendProfileApprovalEmail('user@somaiya.edu', 'Alex Kumar');
  assert.strictEqual(p1.success, false);

  const p2 = await freshEmailUtil.sendAchievementApprovalEmail('user@somaiya.edu', 'Landed Google SWE Internship');
  assert.strictEqual(p2.success, false);

  const p3 = await freshEmailUtil.sendSupportTicketConfirmation('user@somaiya.edu', 'TICK-1001', 'Unable to book session');
  assert.strictEqual(p3.success, false);

  const p4 = await freshEmailUtil.sendAdminTicketNotification('admin@somaiya.edu', {
    id: 'TICK-1001',
    category: 'TECHNICAL',
    subject: 'Unable to book session',
    message: 'The slot was grayed out.',
    user: { name: 'Alex Kumar', email: 'alex@somaiya.edu' }
  });
  assert.strictEqual(p4.success, false);
  console.log('✓ All templates rendered and executed without throwing exceptions.');

  console.log('\n--- TEST 5: Verify Route Registration in Admin Router ---');
  const adminRouter = require('../src/routes/admin');
  const routes = [];
  adminRouter.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      routes.push(`${methods.join(',')} ${layer.route.path}`);
    }
  });

  assert.ok(routes.includes('PATCH /users/:id/verify'), 'PATCH /users/:id/verify route must be registered');
  assert.ok(routes.includes('PATCH /stories/:id/status'), 'PATCH /stories/:id/status route must be registered');
  console.log('✓ Admin router routes verified:');
  console.log('   - PATCH /users/:id/verify [registered]');
  console.log('   - PATCH /stories/:id/status [registered]');

  console.log('\n--- TEST 6: Verify Route Registration in Support Router ---');
  const supportRouter = require('../src/routes/support');
  const supportRoutes = [];
  supportRouter.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      supportRoutes.push(`${methods.join(',')} ${layer.route.path}`);
    }
  });
  assert.ok(supportRoutes.includes('POST /'), 'POST / route must be registered in support router');
  console.log('✓ Support router POST / route registered.');

  // Restore env
  if (savedResendKey) process.env.RESEND_API_KEY = savedResendKey;
  if (savedUser) process.env.EMAIL_USER = savedUser;
  if (savedPass) process.env.EMAIL_APP_PASSWORD = savedPass;

  console.log('\n========================================');
  console.log('ALL EMAIL & TRIGGER TESTS PASSED! 🎉');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
