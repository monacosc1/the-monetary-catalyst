'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to your error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-dark text-white">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        className="px-4 py-2 bg-primary text-white rounded hover:bg-accent1"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}

