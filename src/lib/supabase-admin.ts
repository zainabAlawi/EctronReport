import { createClient } from '@supabase/supabase-js';

// Note: This client uses the SERVICE ROLE KEY.
// It bypasses Row Level Security (RLS) entirely!
// NEVER use this client on the frontend or expose it to the client side.
// Only use it in secure API routes or Server Actions for admin tasks.

export const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};
