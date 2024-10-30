'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import DotPattern from '@/components/DotPattern'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoggedIn } = useAuth()
  const router = useRouter()

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      router.push('/register?redirect=/pricing')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        throw new Error('No valid session')
      }

      const priceId = isAnnual 
        ? process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID 
        : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId,
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-300">
            Choose the plan that works best for you
          </p>
          
          {/* Billing Toggle */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <span className={`text-lg ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-dark
                ${isAnnual ? 'bg-primary' : 'bg-gray-600'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-lg ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Annually <span className="text-primary">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center">
              Professional
            </h3>
            <div className="mt-4 flex justify-center items-baseline">
              <span className="text-5xl font-extrabold text-gray-900">
                ${isAnnual ? '199' : '24'}
              </span>
              <span className="text-xl text-gray-500">
                /{isAnnual ? 'year' : 'month'}
              </span>
            </div>
            
            <ul className="mt-8 space-y-4">
              {[
                'Access to all premium content',
                'Market analysis reports',
                'Investment ideas and strategies',
                'Priority email support',
                'Early access to new features'
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 text-primary mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Add error message display */}
            {error && (
              <div className="max-w-lg mx-auto mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Update the button to show loading state */}
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={`mt-8 w-full bg-primary hover:bg-accent1 text-white font-bold py-3 px-4 rounded-lg transition-colors ${
                isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Subscribe Now'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
