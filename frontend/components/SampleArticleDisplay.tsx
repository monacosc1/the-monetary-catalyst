'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPublishDate } from '@/utils/dateFormatters';
import articleService from '@/services/articleService';
import ArticleImage from './ArticleImage';

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
    console.log('Rendering section details:', {
      sectionType: section.type,
      sectionChildren: section.children,
      fullSection: section
    });

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
            console.log('Processing child in paragraph:', {
              childType: child.type,
              childUrl: child.url,
              childText: child.text,
              fullChild: child
            });

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
                  {child.children[0]?.text || 'Link'}
                </a>
              );
            }
            return null;
          })}
        </p>
      );
    }

    if (section.type === 'image') {
      console.log('Image section data:', {
        fullSection: section,
        imageData: section.image,
        strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL,
        imageUrl: section.image.url,
        hasStrapi: section.image.url.includes(process.env.NEXT_PUBLIC_STRAPI_URL)
      });
      
      const imageUrl = section.image.url.startsWith('http') 
        ? section.image.url 
        : `${process.env.NEXT_PUBLIC_STRAPI_URL}${section.image.url}`;
      
      return (
        <div key={section.id} className="my-8">
          <Image
            src={imageUrl}
            alt={section.caption || 'Article image'}
            width={800}
            height={400}
            className="rounded-lg mx-auto"
          />
          {section.caption && (
            <p className="text-sm text-gray-600 text-center mt-2">
              {section.caption}
            </p>
          )}
        </div>
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
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-4xl">
            <Image 
              src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${article.feature_image_url.url}`}
              alt={article.title}
              width={1200}
              height={600}
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
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