import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-[#08080d] text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to The Monetary Catalyst</h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-8">Empowering investors with professional financial research and strategies</p>
          <Link 
            href="/subscribe" 
            className="bg-[#5064fa] hover:bg-[#01baef] text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow bg-white text-[#08080d]">
        {/* Latest Analysis Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Latest Insights</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-100 p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold mb-4">Market Analysis</h3>
                <p className="text-gray-700 mb-4">Stay ahead of market trends with our expert analysis and insights.</p>
                <Link href="/research/market-analysis" className="text-[#5064fa] hover:text-[#01baef] font-semibold">Read More →</Link>
              </div>
              <div className="bg-gray-100 p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold mb-4">Investment Ideas</h3>
                <p className="text-gray-700 mb-4">Discover potential opportunities with our curated investment ideas.</p>
                <Link href="/research/investment-ideas" className="text-[#5064fa] hover:text-[#01baef] font-semibold">Explore Ideas →</Link>
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
                <p className="text-gray-700">In-depth research from seasoned financial professionals</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Image src="/placeholder.svg" alt="Timely Insights" width={64} height={64} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Timely Insights</h3>
                <p className="text-gray-700">Stay updated with the latest market trends and opportunities</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Image src="/placeholder.svg" alt="Actionable Strategies" width={64} height={64} className="mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Actionable Strategies</h3>
                <p className="text-gray-700">Practical investment ideas to help you make informed decisions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-[#001e46] text-white py-16 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Elevate Your Investment Strategy?</h2>
            <p className="text-xl mb-8">Join The Monetary Catalyst today and gain access to premium financial insights.</p>
            <Link 
              href="/subscribe" 
              className="bg-[#5064fa] hover:bg-[#01baef] text-white px-8 py-3 rounded-full text-lg font-semibold transition-colors inline-block"
            >
              Subscribe Now
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}