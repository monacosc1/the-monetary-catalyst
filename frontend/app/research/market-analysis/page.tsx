import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { marketAnalysisArticles } from '@/mockData/marketAnalysisArticles';
import DotPattern from '@/components/DotPattern';

const MarketAnalysisPage = () => {
  return (
    <div className="bg-background-dark text-white min-h-screen">
      <section className="py-20 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center">
            The Monetary Catalyst Market Analysis
          </h1>
          
          <div className="space-y-12">
            {marketAnalysisArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-lg shadow-xl overflow-hidden">
                <div className="md:flex">
                  <div className="md:flex-shrink-0">
                    <Image
                      src={article.imageUrl}
                      alt={article.title}
                      width={300}
                      height={200}
                      className="h-48 w-full object-cover md:w-48"
                    />
                  </div>
                  <div className="p-8">
                    <p className="text-sm text-gray-500 mb-1">{article.date}</p>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">{article.title}</h2>
                    <p className="text-gray-600 mb-4">{article.excerpt}</p>
                    <Link 
                      href={`/research/market-analysis/${article.slug}`}
                      className="text-primary hover:text-accent1 font-semibold"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketAnalysisPage;

