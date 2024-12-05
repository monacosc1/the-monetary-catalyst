import Link from 'next/link';
import DotPattern from '@/components/DotPattern';
import { BarChart2, Lightbulb } from 'lucide-react';

export default function SamplesPage() {
  return (
    <div className="bg-background-dark text-white">
      <section className="py-20 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            Sample Premium Content
          </h1>
          <p className="text-xl text-center mb-12">
            Experience the depth and quality of our premium research with these sample articles.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Market Analysis Sample */}
            <div className="bg-white rounded-lg p-8 shadow-xl text-gray-800">
              <BarChart2 className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-4 text-center">Market Analysis Sample</h2>
              <p className="text-center mb-6">
                Get a taste of our in-depth market analysis and economic insights.
              </p>
              <div className="text-center">
                <Link 
                  href="/samples/market-analysis-sample"
                  className="inline-block bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Read Sample →
                </Link>
              </div>
            </div>

            {/* Investment Ideas Sample */}
            <div className="bg-white rounded-lg p-8 shadow-xl text-gray-800">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-4 text-center">Investment Ideas Sample</h2>
              <p className="text-center mb-6">
                Preview our actionable investment recommendations and analysis.
              </p>
              <div className="text-center">
                <Link 
                  href="/samples/investment-ideas-sample"
                  className="inline-block bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300"
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
