import LoginForm from './LoginForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/electricity/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 glass rounded-2xl border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            ECTRON Smart
          </h1>
          <p className="text-zinc-400 mt-2">Sign in to your account</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
}
