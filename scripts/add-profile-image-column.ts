import { supabase } from '../server/supabase-client.js';

async function addProfileImageColumn() {
  try {
    console.log('Adding profile_image_url column to users table...');
    
    // Add the column using raw SQL
    const { data, error } = await supabase.rpc('add_profile_image_column', {});
    
    if (error) {
      // Try alternative approach with direct SQL
      const { error: sqlError } = await supabase
        .from('users')
        .select('profile_image_url')
        .limit(1);
        
      if (sqlError && sqlError.message.includes("column") && sqlError.message.includes("does not exist")) {
        console.log('Column does not exist, but we cannot create it via RPC. Please add manually in Supabase dashboard.');
        console.log('Run this SQL in your Supabase SQL editor:');
        console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;');
      } else {
        console.log('Column already exists or other error:', sqlError?.message);
      }
    } else {
      console.log('✅ Column added successfully');
    }
  } catch (error) {
    console.error('Error adding column:', error);
    console.log('\n📝 Manual action needed:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run this command:');
    console.log('   ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;');
  }
}

addProfileImageColumn();