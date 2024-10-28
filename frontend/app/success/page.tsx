'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DotPattern from '@/components/DotPattern'

export default function SuccessPage() {
  const [message, setMessage] = useState('Processing your subscription...')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      router.push('/pricing')
      return
    }

    const verifySession = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify-session?session_id=${sessionId}`)
        const data = await response.json()
        
        if (data.success) {
          setMessage('Thank you for your subscription! You now have access to all premium content.')
          setTimeout(() => router.push('/'), 5000)
        } else {
          setError('There was an issue verifying your subscription. Please contact support.')
        }
      } catch (error) {
        console.error('Error verifying session:', error)
        setError('There was an error processing your subscription. Please contact support.')
      } finally {
        setIsLoading(false)
      }
    }

    verifySession()
  }, [searchParams, router])

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
            <div className="text-red-400 text-xl mb-8">{error}</div>
          ) : (
            <p className="text-xl mb-8">{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
