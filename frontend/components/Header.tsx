'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DotPattern from './DotPattern'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const router = useRouter()
  const { isLoggedIn, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-[#001e46] py-4 border-b border-gray-700">
      <DotPattern />
      <div className="container mx-auto px-4 flex justify-between items-center z-10">
        <div className="w-1/4">
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="The Monetary Catalyst"
              width={300}
              height={75}
              className="max-h-16 w-auto"
              priority
            />
          </Link>
        </div>
        <nav className="w-1/2 flex justify-center">
          <ul className="flex space-x-12">
            <li><Link href="/about" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">About</Link></li>
            <li><Link href="/research" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">Research</Link></li>
            <li><Link href="/contact" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">Contact</Link></li>
          </ul>
        </nav>
        <div className="w-1/4 flex justify-end items-center space-x-6">
          {isLoggedIn ? (
            <>
              <Link href="/my-account" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">
                My Account
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold"
              >
                Logout
              </button>
              <Link 
                href="/pricing" 
                className="bg-[#5064fa] hover:bg-[#01baef] text-[#ffffff] px-4 py-2 rounded transition-colors text-lg font-bold"
              >
                Upgrade
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">
                Login
              </Link>
              <Link 
                href="/pricing" 
                className="bg-[#5064fa] hover:bg-[#01baef] text-[#ffffff] px-4 py-2 rounded transition-colors text-lg font-bold"
              >
                Subscribe
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
