import React from 'react';
import Link from 'next/link';
import DotPattern from '@/components/DotPattern';
import { BarChart2, Lightbulb } from 'lucide-react';

const ResearchPage = () => {
  return (
    <div className="bg-background-dark text-white">
      <section className="py-20 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            The Monetary Catalyst Research
          </h1>
          <p className="text-xl text-center mb-12">
            An independent, value-oriented and contrary-minded commentary on the financial markets
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-8 shadow-xl text-gray-800">
              <BarChart2 className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-4 text-center">Market Analysis</h2>
              <p className="text-center mb-6">
                In-depth analysis of market trends, economic indicators, and global events impacting financial markets.
              </p>
              <div className="text-center">
                <Link 
                  href="/research/market-analysis" 
                  className="inline-block bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  View Market Analysis
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-xl text-gray-800">
              <Lightbulb className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-bold mb-4 text-center">Investment Ideas</h2>
              <p className="text-center mb-6">
                Curated investment opportunities, stock picks, and strategic insights for informed decision-making.
              </p>
              <div className="text-center">
                <Link 
                  href="/research/investment-ideas" 
                  className="inline-block bg-primary hover:bg-accent1 text-white font-bold py-2 px-4 rounded transition duration-300"
                >
                  Explore Investment Ideas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResearchPage;
