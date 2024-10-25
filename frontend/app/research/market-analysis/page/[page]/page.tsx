import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { marketAnalysisArticles } from '@/mockData/marketAnalysisArticles';

const MarketAnalysisPage = ({ params }: { params: { page: string } }) => {
  const currentPage = parseInt(params.page, 10);
  const articlesPerPage = 10;
  const startIndex = (currentPage - 1) * articlesPerPage;
  const endIndex = startIndex + articlesPerPage;
  const currentArticles = marketAnalysisArticles.slice(startIndex, endIndex);

  return (
    <div className="bg-white text-black min-h-screen">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-black">
            The Monetary Catalyst Market Analysis
          </h1>
          
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-2/3 space-y-12">
              {currentArticles.map((article) => (
                <div key={article.id} className="bg-gray-100 rounded-lg shadow-xl overflow-hidden">
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
                      <p className="text-sm text-gray-600 mb-1">{article.date}</p>
                      <h2 className="text-2xl font-semibold text-black mb-2">{article.title}</h2>
                      <p className="text-gray-700 mb-4">{article.excerpt}</p>
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

              {/* Pagination */}
              <div className="flex justify-between items-center mt-8">
                <Link href="/research/market-analysis" className="bg-primary text-white px-4 py-2 rounded hover:bg-accent1">
                  ← Previous Page
                </Link>
                <span className="text-gray-600">Page 2 of 2</span>
              </div>
            </div>
            
            <div className="md:w-1/3 space-y-8 md:sticky md:top-20 self-start">
              <div className="bg-gray-100 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Monthly Newsletter Sign Up</h2>
                <form className="space-y-4">
                  <input type="text" placeholder="Name" className="w-full p-2 border rounded" />
                  <input type="email" placeholder="Email" className="w-full p-2 border rounded" />
                  <button type="submit" className="w-full bg-primary text-white p-2 rounded hover:bg-accent1">
                    Subscribe
                  </button>
                </form>
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg">
                <input type="search" placeholder="Search..." className="w-full p-2 border rounded" />
              </div>
              
              <div className="bg-gray-100 p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Popular Posts</h2>
                <ul className="space-y-4">
                  {marketAnalysisArticles.slice(0, 3).map((article) => (
                    <li key={article.id}>
                      <Link href={`/research/market-analysis/${article.slug}`} className="text-primary hover:text-accent1">
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MarketAnalysisPage;

