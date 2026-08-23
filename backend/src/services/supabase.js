// backend/src/services/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rbcswrdndqylswladdue.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client in backend:', err);
  }
}

const REQUIRED_BUCKETS = ['avatars', 'resumes', 'certificates', 'stories', 'documents'];

/**
 * Automatically ensures all required public storage buckets exist on Supabase
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

    for (const bucket of REQUIRED_BUCKETS) {
      if (!existingNames.has(bucket)) {
        console.log(`📦 Creating Supabase storage bucket: ${bucket}`);
        const { error: createError } = await supabase.storage.createBucket(bucket, {
          public: true,
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
 * Upload a file directly to a Supabase bucket and return its public URL
 */
async function uploadToStorage(bucket, filePath, fileBuffer, mimeType) {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

module.exports = {
  supabase,
  supabaseUrl,
  ensureStorageBuckets,
  uploadToStorage,
};
