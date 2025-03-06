'use client'

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DotPattern from '@/components/DotPattern';
import { supabase } from '@/utils/supabase';

export default function SuccessPage() {
  const [message, setMessage] = useState('Processing your subscription...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();

  const verifySession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication error. Please try logging in again.');
      }

      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        throw new Error('No session ID provided');
      }

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), 15000)
      );

      const verificationPromise = fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verify-session?session_id=${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      const response = (await Promise.race([verificationPromise, timeoutPromise])) as Response;
      const data = await response.json();
      
      if (data.success) {
        setMessage('Thank you for your subscription! You now have access to all premium content.');
        setTimeout(() => router.push('/'), 5000);
      } else {
        throw new Error('There was an issue verifying your subscription. Please retry.');
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      if (retryCount < 3) {
        setError('Verification failed. Click "Retry" to try again.');
      } else {
        setError('Max retries reached. Please contact support at support@themonetarycatalyst.com');
      }
    } finally {
      setIsLoading(false);
    }
  }, [retryCount, searchParams, router]);

  useEffect(() => {
    if (searchParams.get('session_id')) {
      verifySession();
    } else {
      router.push('/pricing');
    }
  }, [searchParams, router, verifySession]);

  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Subscription Status</h1>
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-xl">{message}</p>
            </div>
          ) : error ? (
            <div>
              <p className="text-red-400 text-xl mb-4">{error}</p>
              {retryCount < 3 && (
                <button
                  onClick={() => { setRetryCount(retryCount + 1); verifySession(); }}
                  className="bg-primary hover:bg-accent1 text-white py-2 px-4 rounded transition-colors"
                >
                  Retry Verification
                </button>
              )}
              <p className="mt-4 text-gray-400">
                If issues persist, please contact our support team at{' '}
                <a href="mailto:support@themonetarycatalyst.com" className="underline hover:text-white">
                  support@themonetarycatalyst.com
                </a>
              </p>
            </div>
          ) : (
            <p className="text-xl mb-8">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}