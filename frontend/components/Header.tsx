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
  const [isResearchDropdownOpen, setIsResearchDropdownOpen] = useState(false)
  const [isAboutDropdownOpen, setIsAboutDropdownOpen] = useState(false)
  const accountDropdownRef = useRef<HTMLDivElement>(null)
  const researchDropdownRef = useRef<HTMLLIElement>(null)
  const aboutDropdownRef = useRef<HTMLLIElement>(null)

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
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false)
      }
      if (researchDropdownRef.current && !researchDropdownRef.current.contains(event.target as Node)) {
        setIsResearchDropdownOpen(false)
      }
      if (aboutDropdownRef.current && !aboutDropdownRef.current.contains(event.target as Node)) {
        setIsAboutDropdownOpen(false)
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
            <li className="relative" ref={aboutDropdownRef}>
              <div className="flex items-center">
                <button
                  onClick={() => setIsAboutDropdownOpen(!isAboutDropdownOpen)}
                  className="flex items-center text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold"
                >
                  <span className="mr-1">About</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {isAboutDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link 
                    href="/about" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsAboutDropdownOpen(false)}
                  >
                    About Us
                  </Link>
                  <Link 
                    href="/samples" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsAboutDropdownOpen(false)}
                  >
                    View Samples
                  </Link>
                  <Link 
                    href="/terms" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsAboutDropdownOpen(false)}
                  >
                    Terms & Conditions
                  </Link>
                  <Link 
                    href="/privacy" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsAboutDropdownOpen(false)}
                  >
                    Privacy Policy
                  </Link>
                </div>
              )}
            </li>
            <li className="relative" ref={researchDropdownRef}>
              <div className="flex items-center">
                <button
                  onClick={() => setIsResearchDropdownOpen(!isResearchDropdownOpen)}
                  className="flex items-center text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold"
                >
                  <span className="mr-1">Research</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              {isResearchDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link 
                    href="/research" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsResearchDropdownOpen(false)}
                  >
                    Research Overview
                  </Link>
                  <Link 
                    href="/research/market-analysis" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsResearchDropdownOpen(false)}
                  >
                    Market Analysis
                  </Link>
                  <Link 
                    href="/research/investment-ideas" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsResearchDropdownOpen(false)}
                  >
                    Investment Ideas
                  </Link>
                </div>
              )}
            </li>
            <li><Link href="/contact" className="text-[#ffffff] hover:text-[#ffffff] transition-colors text-lg font-bold">Contact</Link></li>
          </ul>
        </nav>
        <div className="w-1/4 flex justify-end items-center space-x-6">
          {isLoggedIn ? (
            <>
              <div className="relative" ref={accountDropdownRef}>
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
