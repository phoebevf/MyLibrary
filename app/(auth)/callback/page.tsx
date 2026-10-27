"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../lib/store/authStore';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error('Error setting session:', error);
        } else {
          await fetchUser();
        }

        router.replace('/');
      } else {
        router.replace('/login');
      }
    };

    handleAuthCallback();
  }, [router, searchParams, fetchUser]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Completing Login...</h1>
      <p>Please wait while we set up your session.</p>
    </div>
  );
}
