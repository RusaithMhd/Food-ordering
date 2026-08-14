require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: profiles, error } = await supabase.from('profiles').select('id, full_name, email');
  if (error) {
    console.error(error);
    return;
  }
  
  if (profiles.length === 0) {
    console.log("No users found. Please login to the app first so your profile is created.");
    return;
  }
  
  console.log("Found users:");
  console.log(profiles);
  
  // Elevate the first user
  const userId = profiles[0].id;
  
  // Get super admin role id
  const { data: roleData } = await supabase.from('roles').select('id').eq('name', 'SUPER_ADMIN').single();
  if (!roleData) {
    console.log("SUPER_ADMIN role not found in database.");
    return;
  }
  
  const roleId = roleData.id;
  
  // Upsert user_role
  const { error: upsertError } = await supabase.from('user_roles').upsert({
    user_id: userId,
    role_id: roleId
  }, { onConflict: 'user_id, role_id' });
  
  if (upsertError) {
    console.error("Error elevating user:", upsertError);
  } else {
    console.log(`Successfully elevated ${profiles[0].email} to SUPER_ADMIN!`);
  }
}

run();
