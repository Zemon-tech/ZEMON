'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { API_BASE_URL } from '@/lib/api';
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Supabase session error:', error);
          throw error;
        }

        if (!session?.user) {
          console.error('No session or user data found');
          throw new Error('No session');
        }

        // Get user data from GitHub session
        const { user } = session;
        
        // Log the user metadata for debugging
        console.log('GitHub user metadata:', user.user_metadata);
        
        const githubData = {
          name: user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.user_name,
          email: user.email,
          avatar: user.user_metadata.avatar_url,
          github_username: user.user_metadata.user_name,
          github: user.user_metadata.user_name,
          role: 'user',
          _id: user.id,
        };

        // Log the data being sent to the backend
        console.log('Data being sent to backend:', githubData);

        // Sync with MongoDB
        const response = await fetch(`${API_BASE_URL}/api/auth/github/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(githubData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to sync user data');
        }

        // Store the token
        localStorage.setItem('token', data.token);

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/login?error=auth');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Completing Sign In</h2>
        <p className="text-muted-foreground">Please wait while we set up your account...</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Loading</h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
} 