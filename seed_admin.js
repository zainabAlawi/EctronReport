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
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  // 1. Sign up Admin User
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'admin@ectron.local',
    password: 'admin123', // I'll set it to admin123
  });

  if (authError) {
    console.error('Error signing up admin:', authError);
    // Maybe already registered? Let's login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@ectron.local',
        password: 'admin123',
    });
    
    if (loginError) {
        console.error('Could not sign in either:', loginError);
        return;
    }
    
    console.log('User signed in. UUID:', loginData.user.id);
  } else {
    console.log('User signed up. UUID:', authData.user?.id);
  }
}

seed();
