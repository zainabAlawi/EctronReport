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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testCreate() {
  console.log("Creating user without user_metadata...");
  const res1 = await supabase.auth.admin.createUser({
    email: 'test1@ectron.local',
    password: 'password123',
    email_confirm: true
  });
  console.log('Res1 error:', res1.error?.message);

  console.log("Creating user with all meta...");
  const res2 = await supabase.auth.admin.createUser({
    email: 'test2@ectron.local',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      username: 'test2',
      full_name: 'Test Two'
    }
  });
  console.log('Res2 error:', res2.error?.message);
}

testCreate();
