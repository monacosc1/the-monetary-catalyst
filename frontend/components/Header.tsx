'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import DotPattern from './DotPattern'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const router = useRouter()
  const { isLoggedIn, logout } = useAuth()
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    console.log('Logout button clicked')
    try {
      await logout()
      console.log('Logout successful')
      setIsAccountDropdownOpen(false)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, we should close the dropdown and redirect
      setIsAccountDropdownOpen(false)
      router.push('/')
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Add this function to close the dropdown
  const closeDropdown = () => {
    setIsAccountDropdownOpen(false)
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold"
                >
                  My Account
                </button>
                {isAccountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      href="/my-account" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={closeDropdown}
                    >
                      General
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
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
