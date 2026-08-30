// backend/src/services/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rbcswrdndqylswladdue.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey && !supabaseServiceKey.includes("pqAk2pgac6qHyNzwB1mh7A_dUmwL3az")) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client in backend:', err);
  }
}

const PUBLIC_BUCKETS = ['avatars', 'stories', 'documents'];
const PRIVATE_BUCKETS = ['resumes', 'certificates', 'id_cards'];
const ALL_BUCKETS = [...PUBLIC_BUCKETS, ...PRIVATE_BUCKETS];

/**
 * Automatically ensures all required public and private storage buckets exist on Supabase
 */
async function ensureStorageBuckets() {
  if (!supabase) return;
  try {
    const { data: existingBuckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn('⚠️ Supabase listBuckets warning:', error.message);
      return;
    }

    const existingNames = new Set((existingBuckets || []).map((b) => b.name));

    for (const bucket of ALL_BUCKETS) {
      if (!existingNames.has(bucket)) {
        const isPublic = PUBLIC_BUCKETS.includes(bucket);
        console.log(`📦 Creating Supabase storage bucket: ${bucket} (public: ${isPublic})`);
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: isPublic,
          fileSizeLimit: 15 * 1024 * 1024, // 15MB
        });
        if (createError && !createError.message.includes('already exists')) {
          console.warn(`Failed to create bucket ${bucket}:`, createError.message);
        }
      }
    }
  } catch (err) {
    console.warn('Error during Supabase bucket initialization:', err.message);
  }
}

// Auto-run bucket check on startup
ensureStorageBuckets().catch(() => {});

/**
 * Upload a file directly to a Supabase bucket and return its access URL (or storage path if private)
 */
async function uploadToStorage(bucket, filePath, fileBuffer, mimeType) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const isPublic = PUBLIC_BUCKETS.includes(bucket);
  if (isPublic) {
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  }

  // For private buckets, return storage path identifier: supabase://bucket/filePath
  return `supabase://${bucket}/${filePath}`;
}

/**
 * Generate a short-lived signed URL for accessing a private document (e.g. resume)
 * @param {string} bucket - Bucket name (e.g. 'resumes')
 * @param {string} filePath - Path within bucket
 * @param {number} expiresIn - Expiry in seconds (default 300 = 5 minutes)
 */
async function createSignedUrl(bucket, filePath, expiresIn = 300) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const cleanPath = filePath.startsWith(`${bucket}/`) ? filePath.slice(bucket.length + 1) : filePath;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(cleanPath, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/**
 * Delete a file from Supabase storage
 */
async function deleteFromStorage(bucket, filePath) {
  if (!supabase || !filePath) return;
  try {
    const cleanPath = filePath.replace(`supabase://${bucket}/`, '').replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/[^/]+\//, '');
    await supabase.storage.from(bucket).remove([cleanPath]);
  } catch (err) {
    console.warn(`Failed to delete file from ${bucket}/${filePath}:`, err.message);
  }
}

module.exports = {
  supabase,
  supabaseUrl,
  ensureStorageBuckets,
  uploadToStorage,
  createSignedUrl,
  deleteFromStorage,
  PUBLIC_BUCKETS,
  PRIVATE_BUCKETS,
};
