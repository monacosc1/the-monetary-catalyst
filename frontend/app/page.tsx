import Link from 'next/link'
import Image from 'next/image'
import DotPattern from '@/components/DotPattern'

export default function Home() {
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
                  <Image src="/placeholder.svg" alt="Expert Analysis" width={64} height={64} className="mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Expert Analysis</h3>
                  <p>In-depth research from seasoned financial professionals</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <Image src="/placeholder.svg" alt="Timely Insights" width={64} height={64} className="mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Timely Insights</h3>
                  <p>Stay updated with the latest market trends and opportunities</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <Image src="/placeholder.svg" alt="Actionable Strategies" width={64} height={64} className="mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Actionable Strategies</h3>
                  <p>Practical investment ideas to help you make informed decisions</p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action Section */}
          <section className="bg-background-light text-white py-16 px-4 border-b border-gray-700 relative">
            <DotPattern />
            <div className="container mx-auto text-center cta-content relative z-10">
              <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Investment Strategy?</h2>
              <p className="text-xl mb-8">Join The Monetary Catalyst today and gain access to premium financial insights.</p>
              <Link 
                href="/pricing" 
                className="btn btn-primary"
              >
                Subscribe Now
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
