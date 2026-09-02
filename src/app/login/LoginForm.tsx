'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Convert username to email format if necessary, as Supabase Auth prefers emails.
    // For this project, if the user signs in with 'ahmed01', we can map it to 'ahmed01@ectron.local' 
    // when creating users, so they can login. Or we can just use email directly.
    const email = username.includes('@') ? username : `${username}@ectron.local`;

    const supabase = createClient();
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
          {error === 'Invalid login credentials' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Username (اسم المستخدم)
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
          placeholder="ahmed01"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Password (كلمة المرور)
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
          placeholder="••••••••"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري تسجيل الدخول...
          </>
        ) : (
          'تسجيل الدخول (Login)'
        )}
      </button>
    </form>
  );
}
