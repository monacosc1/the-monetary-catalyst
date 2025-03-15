'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import articleService from '@/services/articleService';
import ArticleImage from '@/components/ArticleImage';
import SearchBar from '@/components/SearchBar';
import { formatPublishDate } from '@/utils/dateFormatters';
import { ArticlePreview } from '@/services/articleService';
import NewsletterForm from '@/components/NewsletterForm';

export default function InvestmentIdeasPage() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<ArticlePreview[]>([]);
  const [popularArticles, setPopularArticles] = useState<ArticlePreview[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching investment ideas articles...');
        const [articlesResponse, popularArticlesData] = await Promise.all([
          articleService.getInvestmentIdeasPreviews(1, 10),
          articleService.getPopularInvestmentIdeas(3)
        ]);
        
        console.log('Investment articles from API:', articlesResponse.data);
        if (articlesResponse.data.length > 0) {
          console.log('First investment article:', {
            title: articlesResponse.data[0].title,
            type: articlesResponse.data[0].article_type,
            isSample: articlesResponse.data[0].isSample
          });
        }
        
        // Double-check that we only have investment-idea articles
        const investmentArticles = articlesResponse.data.filter(
          article => article.article_type === 'investment-idea'
        );
        
        if (investmentArticles.length !== articlesResponse.data.length) {
          console.warn('Filtered out non-investment-idea articles:', 
            articlesResponse.data.length - investmentArticles.length);
        }
        
        setArticles(investmentArticles);
        setFilteredArticles(investmentArticles);
        setPopularArticles(popularArticlesData.filter(
          article => article.article_type === 'investment-idea'
        ));
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredArticles(articles);
      return;
    }

    const filtered = articles.filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredArticles(filtered);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen">
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center text-black">
            The Monetary Catalyst Investment Ideas
          </h1>
          
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-2/3 space-y-12">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8">
                  <p>No articles found matching your search.</p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div key={article.id} className="bg-gray-100 rounded-lg shadow-xl overflow-hidden">
                    <div className="md:flex">
                      <div className="md:flex-shrink-0">
                        <Link href={`/research/investment-ideas/${article.slug}`}>
                          <ArticleImage
                            imageUrl={article.feature_image_url}
                            title={article.title}
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
                ))
              )}
            </div>
            
            <div className="md:w-1/3 space-y-8 md:sticky md:top-20 self-start">
              <NewsletterForm source="investment-ideas" />
              
              <div className="bg-gray-100 p-6 rounded-lg">
                <SearchBar onSearch={handleSearch} />
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
}