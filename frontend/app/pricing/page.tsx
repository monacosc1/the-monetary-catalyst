'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import DotPattern from '@/components/DotPattern'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const monthlyPrice = 29.95
  const annualPrice = 22.46
  const annualTotal = 269.52
  const annualSavings = 90.00

  const benefits = [
    'Premium Market Analysis',
    'Actionable Investment Ideas'
  ]

  return (
    <main className="flex-grow bg-background-light text-white py-16 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto bg-white text-gray-900 rounded-lg shadow-xl p-8">
          <h2 className="text-4xl font-extrabold text-center mb-8">Memberships</h2>

          <div className="flex flex-col items-center mb-8">
            <div className="relative bg-gray-100 rounded-full p-1 shadow-md mb-4">
              <button
                className={`px-4 py-2 rounded-full ${!isAnnual ? 'bg-primary text-white' : 'text-gray-600'}`}
                onClick={() => setIsAnnual(false)}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-full ${isAnnual ? 'bg-primary text-white' : 'text-gray-600'}`}
                onClick={() => setIsAnnual(true)}
              >
                Annual
              </button>
            </div>
            <div className="text-center text-accent2 flex flex-col items-center">
              <span>Annually you get 25% off,</span>
              <span>which is 3 months free</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-bold mb-2">Professional</h3>
            <p className="text-gray-600 mb-6">
              Single-user access to our industry leading analysis
            </p>

            <div className="text-4xl font-bold mb-2">
              ${isAnnual ? annualPrice.toFixed(2) : monthlyPrice.toFixed(2)}
              <span className="text-xl font-normal text-gray-600"> /Monthly</span>
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isAnnual ? 'max-h-20 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
              <div className="text-lg mb-2">${annualTotal.toFixed(2)} Annually</div>
              <div className="text-accent2">You save ${annualSavings.toFixed(2)} a year</div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="font-semibold">Benefits:</h4>
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-accent2 mr-2" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            <button className="w-full bg-primary hover:bg-accent1 text-white font-bold py-3 px-4 rounded transition duration-300">
              Subscribe
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Membership is automatically renewed.<br />Cancel at any time.
          </div>
        </div>
      </div>
    </main>
  )
}
