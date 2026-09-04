const assert = require('assert');
const cache = require('../src/utils/cache');
const searchRouter = require('../src/routes/search');

async function runTests() {
  console.log('--- TEST 1: In-Memory Cache (Commandment 06) ---');
  cache.set('test:stats', { alumniCount: 1500, verifiedCount: 920 }, 2); // 2s TTL
  const cached = cache.get('test:stats');
  assert.deepStrictEqual(cached, { alumniCount: 1500, verifiedCount: 920 });
  console.log('✓ Cache hit verified for test:stats');

  // Test prefix deletion
  cache.set('directory:filter:cse', ['user-1', 'user-2']);
  cache.set('directory:filter:ece', ['user-3']);
  cache.delPrefix('directory:filter:');
  assert.strictEqual(cache.get('directory:filter:cse'), null);
  assert.strictEqual(cache.get('directory:filter:ece'), null);
  console.log('✓ Prefix invalidation verified.');

  console.log('\n--- TEST 2: Search Router Registration (Commandment 05 & Bug Fix) ---');
  const routes = [];
  searchRouter.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      routes.push(`${methods.join(',')} ${layer.route.path}`);
    }
  });
  assert.ok(routes.includes('GET /'), 'GET / route must be registered in search router');
  console.log('\n--- TEST 3: Geo-Coordinates Resolver (Leaflet Pipeline) ---');
  const { resolveCoordinates } = require('../src/utils/geo');
  const mumbai = resolveCoordinates('Mumbai, Maharashtra');
  assert.ok(mumbai, 'Mumbai must resolve');
  assert.strictEqual(mumbai.city, 'Mumbai');
  assert.strictEqual(mumbai.country, 'India');
  assert.ok(typeof mumbai.lat === 'number' && typeof mumbai.lng === 'number');
  console.log('✓ Domestic city resolved:', mumbai);

  const sf = resolveCoordinates('San Francisco / Remote');
  assert.ok(sf, 'San Francisco must resolve');
  assert.strictEqual(sf.city, 'San Francisco');
  assert.strictEqual(sf.country, 'USA');
  console.log('✓ International city resolved:', sf);

  console.log('\n--- TEST 4: Users Geo-Distribution Route Registration ---');
  const usersRouter = require('../src/routes/users');
  const userRoutes = [];
  usersRouter.stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
      userRoutes.push(`${methods.join(',')} ${layer.route.path}`);
    }
  });
  assert.ok(userRoutes.includes('GET /geo-distribution'), 'GET /geo-distribution must be registered in users router');
  console.log('✓ Users router GET /geo-distribution verified.');

  console.log('\n========================================');
  console.log('ALL SEARCH, CACHE & GEO TESTS PASSED! 🎉');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
