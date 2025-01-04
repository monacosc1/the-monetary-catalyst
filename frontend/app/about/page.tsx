'use client'

import Link from 'next/link'
import DotPattern from '@/components/DotPattern'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background-dark text-white">
      {/* Combined Hero and Links Section */}
      <section className="py-20 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">About The Monetary Catalyst</h1>
          <div className="max-w-3xl mx-auto bg-white rounded-lg p-8 shadow-xl mb-16">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary">A WORD FROM THE FOUNDER</h2>
            <div className="space-y-4 text-gray-800">
              <p>Dear future subscriber,</p>
              <p>
                I founded The Monetary Catalyst in 2023 as an independent investment research firm
                dedicated to providing actionable insights in an ever-changing financial landscape.
                Our mission is to empower investors with the knowledge and analysis needed to make
                informed decisions in today&apos;s complex markets.
              </p>
              <p>
                In our short but impactful history, we&apos;ve quickly established ourselves as a
                trusted source of financial wisdom. Our offerings have expanded to include a
                comprehensive suite of resources tailored to the needs of modern investors:
                our flagship weekly publication, our daily market briefings, and our in-depth
                sector analysis reports.
              </p>
              <p>
                At The Monetary Catalyst, we pride ourselves on delivering original thinking,
                rigorous financial analysis, and clear, concise writing. We cater to smart,
                demanding readers like you who seek a deeper understanding of market dynamics
                and investment opportunities.
              </p>
              <p>
                Welcome to The Monetary Catalyst. We look forward to being your trusted partner
                in navigating the financial markets.
              </p>
              <div className="mt-8">
                <p className="font-semibold">
                  Sincerely,<br />
                  Scott M.<br />
                  Founder and Chief Analyst
                </p>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-800">Premium Content Samples</h3>
              <p className="text-gray-600 text-center">Explore examples of our expert analysis and insights</p>
              <div className="text-center mt-4">
                <Link href="/samples" className="text-primary hover:text-accent1 font-semibold">
                  View Samples →
                </Link>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-800">Terms & Conditions</h3>
              <p className="text-gray-600 text-center">Read our terms of service and user agreement</p>
              <div className="text-center mt-4">
                <Link href="/terms" className="text-primary hover:text-accent1 font-semibold">
                  Read Terms →
                </Link>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2 text-center text-gray-800">Privacy Policy</h3>
              <p className="text-gray-600 text-center">Learn how we protect and handle your data</p>
              <div className="text-center mt-4">
                <Link href="/privacy" className="text-primary hover:text-accent1 font-semibold">
                  View Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
