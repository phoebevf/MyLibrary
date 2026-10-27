'use client';

import React, { Suspense } from 'react';

/**
 * This layout wraps the AuthCallbackPage with a Suspense boundary.
 * It prevents the Next.js build from failing when trying to prerender 
 * the client component that uses 'useSearchParams()'.
 */
export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading authentication...</div>}>
      {children}
    </Suspense>
  );
}
