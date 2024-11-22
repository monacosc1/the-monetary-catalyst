import { Suspense } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';
import articleService from '@/services/articleService';
import DotPattern from '@/components/DotPattern';
import ArticleImage from '@/components/ArticleImage';
import { formatPublishDate } from '@/utils/dateFormatters';

// Add this at the top of the file
export const revalidate = 0;  // Disable caching

// Make the component async to fetch data
export default async function InvestmentIdeasPage() {
  try {
    // Fetch articles and popular articles in parallel
    const [articlesResponse, popularArticles] = await Promise.all([
      articleService.getInvestmentIdeasPreviews(1, 10), // We'll create this function
      articleService.getPopularInvestmentIdeas(3)       // We'll create this function
    ]);

    console.log('Articles Response:', articlesResponse); // Debug log

    const { data: articles, meta } = articlesResponse;
    
    if (!articles || articles.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl">No articles found</h2>
          <p>Check back soon for new content!</p>
        </div>
      );
    }

    const totalPages = Math.ceil(meta.pagination.total / 10);

    return (
      <div className="bg-white text-black min-h-screen">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-black">
              The Monetary Catalyst Investment Ideas
            </h1>
            
            <div className="flex flex-col md:flex-row gap-12">
              <div className="md:w-2/3 space-y-12">
                {articles.map((article) => (
                  <div key={article.id} className="bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                    <div className="md:flex">
                      <div className="md:flex-shrink-0">
                        <Link href={`/research/investment-ideas/${article.slug}`}>
                          <ArticleImage
                            imageUrl={article.feature_image_url}
                            title={article.title}
                            strapiUrl={process.env.NEXT_PUBLIC_STRAPI_URL || ''}
                            className="cursor-pointer transition-opacity hover:opacity-80"
                          />
                        </Link>
                      </div>
                      <div className="p-8">
                        <p className="text-sm text-gray-600 mb-1">
                          {formatPublishDate(article.publish_date)}
                        </p>
                        <Link 
                          href={`/research/investment-ideas/${article.slug}`}
                          className="block mb-2"
                        >
                          <h2 className="text-2xl font-semibold text-black hover:text-primary transition-colors cursor-pointer">
                            {article.title}
                          </h2>
                        </Link>
                        <p className="text-gray-700 mb-4">{article.excerpt}</p>
                        <Link 
                          href={`/research/investment-ideas/${article.slug}`}
                          className="text-primary hover:text-accent1 font-semibold"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-8">
                    <span className="text-gray-600">Page 1 of {totalPages}</span>
                    {totalPages > 1 && (
                      <Link 
                        href="/research/investment-ideas/page/2" 
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-accent1"
                      >
                        Next Page →
                      </Link>
                    )}
                  </div>
                )}
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
                    {popularArticles.map((article) => (
                      <li key={article.id}>
                        <Link 
                          href={`/research/investment-ideas/${article.slug}`} 
                          className="text-primary hover:text-accent1"
                        >
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
  } catch (error) {
    console.error('Error in InvestmentIdeasPage:', error);
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl">Error loading articles</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      </div>
    );
  }
}
