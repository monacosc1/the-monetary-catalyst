'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'

interface SubscriptionInfo {
  status: string
  plan_type: string
  subscription_type: string
  end_date: string | null
  cancelled_at: string | null
}

export default function SubscriptionDetails({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const fetchSubscription = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_type, subscription_type, end_date, cancelled_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Raw subscription data:', data);
      console.log('Query error:', error);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Transform the data
      const transformedData = data ? {
        status: data.status,
        plan_type: data.plan_type,
        subscription_type: data.subscription_type,
        end_date: data.end_date,
        cancelled_at: data.cancelled_at
      } : {
        status: 'inactive',
        plan_type: null,
        subscription_type: null,
        end_date: null,
        cancelled_at: null
      };

      console.log('Transformed subscription data:', transformedData);
      setSubscription(transformedData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Failed to load subscription details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      console.log('Fetching subscription for userId:', userId);
      fetchSubscription();
    }
  }, [userId]);

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No valid session')
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/cancel-subscription`;
      console.log('Calling URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Failed to cancel subscription: ${errorText}`);
      }

      await fetchSubscription()
      setShowCancelModal(false)
      setMessage(`Your subscription has been cancelled and will remain active until ${formatDate(subscription?.end_date || null)}.`)
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      setError(error instanceof Error ? error.message : 'Failed to cancel subscription')
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Subscription Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                <span className={`inline-flex px-2 py-1 text-sm rounded-full ${
                  subscription?.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : subscription?.status === 'inactive'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscription?.status || 'inactive'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Plan Type</label>
              <div className="mt-1 text-gray-900">
                {subscription?.plan_type || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Subscription Type</label>
              <div className="mt-1 text-gray-900">
                {subscription?.subscription_type || 'N/A'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">End Date</label>
              <div className="mt-1 text-gray-900">
                {formatDate(subscription?.end_date || null)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md">
          {message}
        </div>
      )}

      {/* Only show cancel button if subscription is active AND not already cancelled */}
      {subscription?.status === 'active' && !subscription?.cancelled_at && (
        <div className="mt-8">
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      {/* Show expiration message if subscription is cancelled but still active */}
      {subscription?.status === 'active' && subscription?.cancelled_at && (
        <div className="mt-4 p-4 bg-gray-50 text-gray-800 rounded-md">
          Your subscription is set to expire on {formatDate(subscription?.end_date || null)}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Cancel Subscription?</h3>
            <p className="text-gray-600 mb-6">
              Your subscription will remain active until {formatDate(subscription?.end_date || null)}. After this date, you will lose access to premium content.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isCancelling}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 