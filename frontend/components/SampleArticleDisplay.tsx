// /frontend/components/SampleArticleDisplay.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPublishDate } from '@/utils/dateFormatters';
import { ArticlePreview, ContentBlock, ContentChild, StrapiImage } from '@/services/articleService';

interface SampleArticleDisplayProps {
  article: ArticlePreview | null;
  articleType: 'market-analysis' | 'investment-ideas';
}

export default function SampleArticleDisplay({ article, articleType }: SampleArticleDisplayProps) {
  // Helper function to clean image URLs with proper typing
  const getCleanImageUrl = (imageData: string | { data?: { attributes: StrapiImage['attributes'] } } | StrapiImage['attributes'] | null): string | null => {
    if (!imageData) return null;
    if (typeof imageData === 'string') return imageData; // Use the URL directly if it's a string
    const rawUrl = 'data' in imageData && imageData.data?.attributes?.url || 'url' in imageData && imageData.url;
    return rawUrl || null;
  };

  const renderContent = (section: ContentBlock) => {
    console.log('Rendering section details:', {
      sectionType: section.type,
      sectionChildren: section.children,
      fullSection: section,
    });

    if (section.type === 'heading') {
      const HeadingTag = `h${section.level || 3}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag key={section.id || section.type} className="text-2xl font-bold mt-6 mb-4">
          {section.children[0].text}
        </HeadingTag>
      );
    }

    if (section.type === 'paragraph') {
      return (
        <p key={section.id || section.type} className="mb-4 text-gray-800">
          {section.children.map((child: ContentChild, index: number) => {
            console.log('Processing child in paragraph:', {
              childType: child.type,
              childUrl: child.url,
              childText: child.text,
              fullChild: child,
            });

            if (child.type === 'text') {
              return child.text;
            }
            if (child.type === 'link') {
              return (
                <a
                  key={index}
                  href={child.url || '#'}
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

      const imageUrl = getCleanImageUrl(section.image);
      if (!imageUrl) return null;

      return (
        <div key={section.id || section.type} className="my-8">
          <Image
            src={imageUrl}
            alt={section.image?.alternativeText || section.image?.caption || 'Article image'}
            width={800}
            height={400}
            className="rounded-lg mx-auto"
          />
          {section.image?.caption && (
            <p className="text-sm text-gray-600 text-center mt-2">{section.image.caption}</p>
          )}
        </div>
      );
    }

    return null;
  };

  if (!article) {
    return <div>Article not found</div>;
  }

  const featureImageUrl = getCleanImageUrl(article.feature_image_url);

  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-xl">
      {/* Sample Content Banner */}
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p className="font-bold">Sample Premium Content</p>
        <p>This is an example of our premium {articleType.replace('-', ' ')} content.</p>
      </div>

      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

      <p className="text-gray-600 mb-4">
        By {article.author} | Published on {formatPublishDate(article.publish_date)}
      </p>

      {/* Feature Image */}
      {featureImageUrl && (
        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-4xl">
            <Image
              src={featureImageUrl}
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
        {Array.isArray(article.content) &&
          article.content.map((section, index) => (
            <div key={index}>{renderContent(section)}</div>
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