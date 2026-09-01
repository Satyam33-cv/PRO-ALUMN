const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Applying Supabase RLS policies for videos bucket...');
  try {
    await prisma.$executeRawUnsafe(`CREATE POLICY "Public Uploads videos" ON storage.objects FOR INSERT TO public WITH CHECK ( bucket_id = 'videos' );`);
    console.log('✅ Upload policy created');
  } catch (err) {
    console.log('Upload policy might already exist:', err.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`CREATE POLICY "Public Access videos" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'videos' );`);
    console.log('✅ Select policy created');
  } catch (err) {
    console.log('Select policy might already exist:', err.message);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
