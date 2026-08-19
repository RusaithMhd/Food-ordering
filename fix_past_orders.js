const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: profiles, error: err } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number');
  if (err) {
    console.error(err);
  } else {
    console.log('Profiles:', profiles);
  }
}

run();
