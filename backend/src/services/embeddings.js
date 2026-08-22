// apps/api/src/services/embeddings.js
// Profile embeddings for smart matching (384-dim for pgvector)
// Uses OpenAI text-embedding-3-small when configured, otherwise a deterministic
// local hashing embedding so the whole pipeline works with zero external deps.
const DIM = 384;

// ---------------------------------------------------------------
// Local deterministic embedding (no network, no API key)
// Hash-based bag-of-tokens over words + character 2-grams, L2-normalized.
// ---------------------------------------------------------------
function hashString(str, seed) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function localEmbed(text) {
  const vec = new Float32Array(DIM);
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tokens = normalized.split(' ').filter(Boolean);
  for (const tok of tokens) {
    const h1 = hashString(tok, 1) % DIM;
    const h2 = hashString(tok, 2) % DIM;
    const weight = 1 + (hashString(tok, 3) % 4);
    const sign = hashString(tok, 4) % 2 === 0 ? 1 : -1;
    vec[h1] += sign * weight;
    vec[h2] += sign * weight * 0.5;
    if (tok.length > 2) {
      for (let i = 0; i < tok.length - 1; i++) {
        const big = tok.slice(i, i + 2);
        vec[hashString(big, 5) % DIM] += sign * 0.3;
      }
    }
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < DIM; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < DIM; i++) vec[i] /= norm;
  return Array.from(vec);
}

// ---------------------------------------------------------------
// OpenAI embeddings (text-embedding-3-small, dims=384 to match local)
// Falls back to local hashing on any failure.
// ---------------------------------------------------------------
async function openAIEmbed(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        dimensions: DIM,
        input: String(text || '').slice(0, 8000),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    const emb = data?.data?.[0]?.embedding;
    if (!emb || !Array.isArray(emb)) throw new Error('Empty embedding response');
    return emb.slice(0, DIM);
  } catch (err) {
    console.warn('OpenAI embedding failed, falling back to local:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Public API: returns a 384-dim array, always succeeds
async function generateEmbedding(text) {
  const ai = await openAIEmbed(text);
  return ai || localEmbed(text);
}

// Build a rich profile/query text from structured fields
function profileText({ name, department, batchYear, currentCompany, jobTitle, location, bio, skills, interests, role }) {
  return [
    `name ${name || ''}`,
    `department ${department || ''}`,
    `batch ${batchYear || ''}`,
    `company ${currentCompany || ''}`,
    `job ${jobTitle || ''}`,
    `location ${location || ''}`,
    `role ${role || ''}`,
    `skills ${skills || ''}`,
    `interests ${interests || ''}`,
    bio || '',
  ].filter(Boolean).join(' | ');
}

module.exports = { DIM, generateEmbedding, profileText, localEmbed };
