'use client'

import Link from 'next/link'
import DotPattern from '@/components/DotPattern'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { isLoggedIn } = useAuth()

  return (
    <>
      {/* Hero Section */}
      <section className="bg-background-light text-white pt-24 pb-20 px-4 border-b border-gray-700 relative">
        <DotPattern />
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-block bg-accent2 text-background-light px-3 py-1 rounded-full text-sm font-semibold mb-6">
            Trusted by thousands of investors
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            The Premier Platform for<br />Financial Research
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            The Monetary Catalyst is a cutting-edge, comprehensive platform designed to
            empower investors with professional financial research and winning investment strategies.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/explore" 
              className="bg-primary hover:bg-accent1 text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors"
            >
              Explore Product
            </Link>
            <Link 
              href="/pricing" 
              className="bg-accent2 hover:bg-accent1 text-background-light hover:text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow bg-white">
        <div className="text-content">
          {/* Latest Analysis Section */}
          <section className="py-16 px-4">
            <div className="container mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">Latest Insights</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-gray-100 p-6 rounded-lg shadow-md">
                  <h3 className="text-2xl font-bold mb-4">Market Analysis</h3>
                  <p className="mb-4">Stay ahead of market trends with our expert analysis and insights.</p>
                  <Link href="/research/market-analysis" className="text-primary hover:text-accent1 font-semibold">Read More →</Link>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg shadow-md">
                  <h3 className="text-2xl font-bold mb-4">Investment Ideas</h3>
                  <p className="mb-4">Discover potential opportunities with our curated investment ideas.</p>
                  <Link href="/research/investment-ideas" className="text-primary hover:text-accent1 font-semibold">Explore Ideas →</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="bg-gray-50 py-16 px-4">
            <div className="container mx-auto text-center">
              <h2 className="text-3xl font-bold mb-12">Why Choose The Monetary Catalyst?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Expert Analysis</h3>
                  <p>In-depth research from seasoned financial professionals</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Timely Insights</h3>
                  <p>Stay updated with the latest market trends and opportunities</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Actionable Strategies</h3>
                  <p>Practical investment ideas to help you make informed decisions</p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action Section */}
          {!isLoggedIn && (
            <section className="bg-background-light text-white py-16 px-4 border-b border-gray-700 relative">
              <DotPattern />
              <div className="container mx-auto text-center cta-content relative z-10">
                <h2 className="text-3xl font-bold mb-4">Not Convinced?</h2>
                <p className="text-xl mb-8">Create a FREE account to receive our monthly newsletter & sample premium content.</p>
                <Link 
                  href="/register" 
                  className="btn btn-primary"
                >
                  Register Now
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
