'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DotPattern from '@/components/DotPattern'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setIsLoading(true)

    try {
      console.log('Attempting password reset for:', email)
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          redirectTo: `${window.location.origin}/reset-password`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset instructions');
      }

      setMessage('Please check your email for password reset instructions. The link will expire in 30 minutes.')
    } catch (error: any) {
      console.error('Full error details:', {
        message: error.message,
        status: error?.status,
        name: error?.name,
        stack: error?.stack,
        code: error?.code
      });
      setError(error.message || 'An error occurred while sending the reset instructions. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex-grow bg-background-light text-white py-16 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto bg-white text-gray-900 rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Reset Your Password</h2>
          <p className="text-center text-sm text-gray-600 mb-8">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                {message}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-accent1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
