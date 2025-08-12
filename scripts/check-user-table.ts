import { supabase } from '../server/supabase-client.js';

async function checkUserTable() {
  try {
    // Get table structure by trying to fetch all columns
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching from users table:', error);
      return;
    }
    
    console.log('Users table structure (sample record):', data?.[0] || 'No records found');
    
    // Try to get specific user to see available fields
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username, first_name, last_name, date_of_birth, height, weight, activity_level')
      .limit(1);
    
    console.log('Specific fields test:', userData, userError);
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

checkUserTable();