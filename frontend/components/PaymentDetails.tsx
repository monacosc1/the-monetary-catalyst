'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CardDetails {
  last4: string
  brand: string
  exp_month: number
  exp_year: number
}

// Create a new component for the payment form
function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)
    setMessage(null)

    const { error: submitError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/my-account`,
      }
    })

    if (submitError) {
      setError(submitError.message || 'An error occurred')
      setIsProcessing(false)
    } else {
      setMessage('Payment method updated successfully')
      setTimeout(() => setMessage(''), 3000) // Clear after 3 seconds
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div className="mt-4 text-red-600 text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-4 text-green-600 text-sm">
          {message}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="mt-4 w-full bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
      >
        {isProcessing ? 'Processing...' : 'Update Payment Method'}
      </button>
    </form>
  )
}

export default function PaymentDetails({ userId }: { userId: string }) {
  const [currentCard, setCurrentCard] = useState<CardDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [showUpdateForm, setShowUpdateForm] = useState(false)

  useEffect(() => {
    fetchCurrentCard()
  }, [userId])

  const fetchCurrentCard = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No valid session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/get-payment-method`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()
      if (data.card) {
        setCurrentCard(data.card)
      }
    } catch (error) {
      console.error('Error fetching card details:', error)
      setError('Failed to load payment details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No valid session')

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-setup-intent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const { clientSecret: secret } = await response.json()
      setClientSecret(secret)
      setShowUpdateForm(true)
    } catch (error) {
      console.error('Error initiating card update:', error)
      setError('Failed to start update process')
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Payment Details</h3>
      
      {currentCard && !showUpdateForm && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600">Default Payment Method</h4>
          <div className="mt-1 text-gray-900">
            {currentCard.brand} ending in {currentCard.last4}
            <br />
            Expires {currentCard.exp_month}/{currentCard.exp_year}
          </div>
        </div>
      )}

      {!currentCard && !showUpdateForm && (
        <div className="mb-6 text-gray-600">
          No payment method on file.{' '}
          <button 
            onClick={handleUpdateClick} 
            className="text-primary hover:text-accent1 underline"
          >
            Add Payment Method
          </button>
        </div>
      )}

      {!showUpdateForm ? (
        <button
          onClick={handleUpdateClick}
          className="w-full bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {currentCard ? 'Update Payment Method' : 'Add Payment Method'}
        </button>
      ) : clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm onSuccess={() => {
            setShowUpdateForm(false);
            fetchCurrentCard();
          }} />
        </Elements>
      ) : null}

      {error && (
        <div className="mt-4 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  )
} 