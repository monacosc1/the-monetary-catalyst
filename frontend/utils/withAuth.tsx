import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function WithAuth(props: P) {
    const { isLoggedIn } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoggedIn) {
        router.push('/login')
      }
    }, [isLoggedIn, router])

    if (!isLoggedIn) {
      return null // or a loading spinner
    }

    return <WrappedComponent {...props} />
  }
}
