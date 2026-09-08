const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    acc[key.trim()] = value.trim();
  }
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreate() {
  console.log("Creating user...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: '1192@ectron.local',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      username: '1192',
      full_name: 'Test User'
    }
  });

  if (error) {
    console.error('Error creating user:', JSON.stringify(error, null, 2));
    console.error(error);
  } else {
    console.log('Success:', data.user.id);
  }
}

testCreate();
