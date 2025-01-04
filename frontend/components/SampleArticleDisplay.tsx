'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { formatPublishDate } from '@/utils/dateFormatters';
import articleService from '@/services/articleService';
import Link from 'next/link';

interface SampleArticleDisplayProps {
  articleId: number;
  articleType: 'market-analysis' | 'investment-ideas';
}

interface ArticleData {
  id: number;
  title: string;
  content: Array<{
    type: string;
    children: Array<{
      type: string;
      text?: string;
      url?: string;
      children?: Array<{ text: string }>;
    }>;
    image?: {
      url: string;
      caption?: string;
      alternativeText?: string;
    };
    level?: number;
  }>;
  feature_image_url?: {
    data?: {
      attributes?: {
        url: string;
      };
    };
    url?: string;
  };
  author: string;
  publish_date: string;
}

export default function SampleArticleDisplay({ articleId, articleType }: SampleArticleDisplayProps) {
  const [article, setArticle] = useState<ArticleData | null>(null);
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

  const renderContent = (section: ArticleData['content'][0]) => {
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
          {section.children.map((child, index) => {
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
                  {child.children?.[0]?.text || 'Link'}
                </a>
              );
            }
            return null;
          })}
        </p>
      );
    }

    if (section.type === 'image') {
      if (!section.image) return null;
      
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
      if (!strapiUrl) {
        console.error('NEXT_PUBLIC_STRAPI_URL is not defined');
        return null;
      }
      
      console.log('Image section data:', {
        fullSection: section,
        imageData: section.image,
        strapiUrl,
        imageUrl: section.image.url,
        hasStrapi: section.image.url.includes(strapiUrl)
      });
      
      const imageUrl = section.image.url.startsWith('http') 
        ? section.image.url 
        : `${strapiUrl}${section.image.url}`;
      
      return (
        <div className="my-8">
          <Image
            src={imageUrl}
            alt={section.image.caption || 'Article image'}
            width={800}
            height={400}
            className="rounded-lg mx-auto"
          />
          {section.image.caption && (
            <p className="text-sm text-gray-600 text-center mt-2">
              {section.image.caption}
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
        (() => {
          const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
          if (!strapiUrl) {
            console.error('NEXT_PUBLIC_STRAPI_URL is not defined');
            return null;
          }
          return (
            <div className="mb-8 flex justify-center">
              <div className="w-full max-w-4xl">
                <Image 
                  src={`${strapiUrl}${article.feature_image_url.url}`}
                  alt={article.title}
                  width={1200}
                  height={600}
                  className="w-full h-auto object-contain rounded-lg"
                />
              </div>
            </div>
          );
        })()
      )}

      {/* Article Content */}
      <div className="prose max-w-none">
        {Array.isArray(article.content) && article.content.map((section, index) => (
          <div key={index}>
            {renderContent(section)}
          </div>
        ))}
      </div>

      {/* Back Button */}
      <div className="mt-8">
        <Link 
          href="/samples"
          className="inline-block bg-primary text-white px-4 py-2 rounded hover:bg-accent1 transition-colors"
        >
          ← Back to Samples
        </Link>
      </div>
    </div>
  );
} 