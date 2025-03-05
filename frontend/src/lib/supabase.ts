import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const signInWithGitHub = async () => {
  // Get the current environment's URL
  const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${redirectUrl}/auth/callback`
    }
  });

  if (error) throw error;
  return data;
};

export const handleAuthStateChange = (callback: (session: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      callback(session);
    }
  });
}; 