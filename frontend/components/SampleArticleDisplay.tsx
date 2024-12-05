'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPublishDate } from '@/utils/dateFormatters';
import articleService from '@/services/articleService';

interface SampleArticleDisplayProps {
  articleId: number;
  articleType: 'market-analysis' | 'investment-ideas';
}

export default function SampleArticleDisplay({ articleId, articleType }: SampleArticleDisplayProps) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await articleService.getSampleArticleById(articleId);
        console.log('Sample article response in component:', response);
        setArticle(response);
      } catch (err) {
        setError('Failed to load sample article');
        console.error('Error fetching sample article:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  const renderContent = (section: any) => {
    console.log('Rendering section:', section);

    if (section.type === 'heading') {
      return (
        <h3 className="text-2xl font-bold mt-6 mb-4">
          {section.children[0].text}
        </h3>
      );
    }

    if (section.type === 'paragraph') {
      return (
        <p className="mb-4 text-gray-800">
          {section.children.map((child: any, index: number) => {
            if (child.type === 'text') {
              return child.text;
            }
            if (child.type === 'link') {
              return (
                <a 
                  key={index}
                  href={child.url}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {child.children[0].text || 'Link'}
                </a>
              );
            }
            return null;
          })}
        </p>
      );
    }

    return null;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-xl">
      {/* Sample Content Banner */}
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p className="font-bold">Sample Premium Content</p>
        <p>This is an example of our premium {articleType.replace('-', ' ')} content.</p>
      </div>

      <h1 className="text-4xl font-bold mb-4">
        {article.title}
      </h1>
      
      <p className="text-gray-600 mb-4">
        By {article.author} | Published on {formatPublishDate(article.publish_date)}
      </p>
      
      {/* Feature Image */}
      {article.feature_image_url && (
        <div className="mb-8">
          <Image 
            src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${article.feature_image_url.url}`}
            alt={article.title}
            width={800}
            height={400}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Article Content */}
      <div className="prose max-w-none">
        {Array.isArray(article.content) && article.content.map((section: any, index: number) => (
          <div key={index}>
            {renderContent(section)}
          </div>
        ))}
      </div>
    </div>
  );
} 