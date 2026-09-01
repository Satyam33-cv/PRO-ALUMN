require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBuckets() {
  console.log("Setting up buckets...");
  
  const bucketsToCreate = [
    { name: 'videos', public: true, fileSizeLimit: 157286400, allowedMimeTypes: ['video/mp4', 'video/x-m4v', 'video/webm', 'video/quicktime'] },
    { name: 'avatars', public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
    { name: 'resumes', public: false, fileSizeLimit: 5242880, allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    { name: 'certificates', public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] }
  ];

  for (const b of bucketsToCreate) {
    const { data: bucketExists } = await supabase.storage.getBucket(b.name);
    
    if (bucketExists) {
      console.log(`Bucket '${b.name}' already exists.`);
      // Update the bucket to ensure it has correct public settings
      await supabase.storage.updateBucket(b.name, {
        public: b.public,
        allowedMimeTypes: b.allowedMimeTypes
      });
      console.log(`Updated bucket '${b.name}' settings.`);
    } else {
      const { data, error } = await supabase.storage.createBucket(b.name, {
        public: b.public,
        allowedMimeTypes: b.allowedMimeTypes
      });
      
      if (error) {
        console.error(`Error creating bucket '${b.name}':`, error);
      } else {
        console.log(`Bucket '${b.name}' created successfully:`, data);
      }
    }
  }
}

setupBuckets();
