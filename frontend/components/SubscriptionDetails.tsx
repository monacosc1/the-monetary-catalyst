'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'

interface SubscriptionInfo {
  status: string
  plan_type: string
  subscription_type: string
  end_date: string | null
}

export default function SubscriptionDetails({ userId }: { userId: string }) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true)
        
        // Add proper headers and handle the response differently
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, plan_type, subscription_type, end_date')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle instead of single

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
          end_date: data.end_date
        } : null;

        console.log('Transformed subscription data:', transformedData);
        setSubscription(transformedData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setError('Failed to load subscription details');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      console.log('Fetching subscription for userId:', userId);
      fetchSubscription();
    }
  }, [userId]);

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

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subscription?.status || 'N/A'}
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
    </div>
  )
} 