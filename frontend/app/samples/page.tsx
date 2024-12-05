import Link from 'next/link';
import { SAMPLE_ARTICLES } from '@/config/sampleArticles';

export default function SamplesPage() {
  return (
    <div className="bg-white text-black min-h-screen">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-black">
            Sample Premium Content
          </h1>
          
          <div className="max-w-3xl mx-auto space-y-8">
            <p className="text-center text-xl mb-12">
              Experience the depth and quality of our premium research with these sample articles.
            </p>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Market Analysis Sample */}
              <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Market Analysis Sample</h2>
                <p className="text-gray-600 mb-6">
                  Get a taste of our in-depth market analysis and economic insights.
                </p>
                <Link 
                  href={`/samples/market-analysis-sample`}
                  className="text-primary hover:text-accent1 font-semibold"
                >
                  Read Sample →
                </Link>
              </div>

              {/* Investment Ideas Sample */}
              <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Investment Ideas Sample</h2>
                <p className="text-gray-600 mb-6">
                  Preview our actionable investment recommendations and analysis.
                </p>
                <Link 
                  href={`/samples/investment-ideas-sample`}
                  className="text-primary hover:text-accent1 font-semibold"
                >
                  Read Sample →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
