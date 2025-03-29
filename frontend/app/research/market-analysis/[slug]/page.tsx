// /frontend/app/research/market-analysis/[slug]/page.tsx
'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import DotPattern from '@/components/DotPattern';
import ArticleGate from '@/components/ArticleGate';
import articleService, { ArticlePreview, StrapiImage } from '@/services/articleService';
import { formatPublishDate } from '@/utils/dateFormatters';

// Define the type for article metadata returned in a 403 response
interface ArticleMetadata {
  title?: string;
  publish_date?: string;
  author?: string;
  feature_image_url?: string | { url: string; formats?: Record<string, unknown> };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<ArticlePreview | null>(null);
  const [articleMetadata, setArticleMetadata] = useState<ArticleMetadata>({});
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchArticleAndSubscription = async () => {
      try {
        console.log('Fetching article with slug:', params.slug);
        
        // Fetch article data from backend via articleService
        const articleData = await articleService.getArticleBySlug(params.slug);
        console.log('Article data received:', articleData ? 'Found' : 'Not found');
        
        setArticle(articleData);

        // Check subscription status if user is logged in
        if (user) {
          console.log('Checking subscription for user:', user.id);
          const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .single();

          console.log('Subscription data:', subscription, error);

          if (!error && subscription) {
            setHasActiveSubscription(subscription.status === 'active');
          }
        }
      } catch (error: unknown) {
        console.error('Error fetching data:', error);
        if (error instanceof Error && error.message === 'Access denied: Subscription required') {
          setArticle(null);
          setHasActiveSubscription(false);
          setArticleMetadata((error as Error & { cause?: ArticleMetadata }).cause || {});
        } else {
          setArticle(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticleAndSubscription();
  }, [params.slug, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Helper function to clean image URLs with proper typing
  const getCleanImageUrl = (
    imageData: string | { data?: { attributes: StrapiImage['attributes'] } } | StrapiImage['attributes'] | { url: string; caption?: string; alternativeText?: string } | null | undefined
  ): string | undefined => {
    if (!imageData) return undefined;
    
    // Handle string (direct URL)
    if (typeof imageData === 'string') return imageData;
    
    // Handle nested structure from feature_image_url or section.image
    const rawUrl = 'data' in imageData && imageData.data?.attributes?.url || 'url' in imageData && imageData.url;
    if (!rawUrl) return undefined;

    // Since we're now fetching through the backend, the URL should already be correct
    return rawUrl;
  };

  // If article is not accessible (e.g., 403) and user doesn't have an active subscription, show gated content
  if (!article && !hasActiveSubscription) {
    return (
      <div className="bg-background-dark text-white min-h-screen py-12 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white text-black p-8 rounded-lg shadow-xl">
            <ArticleGate
              title={articleMetadata.title ?? 'Article Title Unavailable'}
              publishDate={articleMetadata.publish_date ? formatPublishDate(articleMetadata.publish_date) : 'Date Unavailable'}
              author={articleMetadata.author ?? 'Author Unavailable'}
              featureImageUrl={getCleanImageUrl(articleMetadata.feature_image_url)}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl">Article not found</h2>
        <p>The article you are looking for does not exist or has been removed.</p>
        <p className="text-sm text-gray-500 mt-2">Debug info: Slug: {params.slug}</p>
      </div>
    );
  }

  // Get feature image URL
  const featureImageUrl = getCleanImageUrl(article.feature_image_url);

  // Full article content for sample articles or subscribed users
  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white text-black p-8 rounded-lg shadow-xl">
          <h1 className="text-4xl font-bold mb-4">
            {article.title}
          </h1>
          <p className="text-gray-600 mb-4">
            By {article.author} | Published on {formatPublishDate(article.publish_date)}
          </p>
          
          {/* Feature Image */}
          {featureImageUrl && (
            <Image 
              src={featureImageUrl}
              alt={article.title}
              width={800}
              height={400}
              className="mb-8 rounded-lg"
            />
          )}

          {/* Article Content */}
          {Array.isArray(article.content) && article.content.map((section, index) => {
            if (section.type === 'paragraph') {
              return (
                <p key={index} className="mb-4">
                  {section.children.map((child, childIndex) => {
                    if (child.type === 'text') {
                      return child.text;
                    }
                    if (child.type === 'link') {
                      return (
                        <a 
                          key={childIndex}
                          href={child.url}
                          className="text-primary hover:text-accent1"
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
            
            if (section.type === 'heading') {
              const HeadingTag = `h${section.level}` as keyof JSX.IntrinsicElements;
              return (
                <HeadingTag key={index} className="text-2xl font-bold mt-6 mb-4">
                  {section.children[0].text}
                </HeadingTag>
              );
            }

            if (section.type === 'image') {
              const imageUrl = getCleanImageUrl(section.image);
              return imageUrl ? (
                <div key={index} className="my-8">
                  <Image
                    src={imageUrl}
                    alt={section.image?.alternativeText || 'Article image'}
                    width={800}
                    height={400}
                    className="rounded-lg mx-auto"
                  />
                  {section.image?.caption && (
                    <p className="text-sm text-gray-600 text-center mt-2">
                      {section.image.caption}
                    </p>
                  )}
                </div>
              ) : null;
            }

            return null;
          })}

          {/* Back Button */}
          <button 
            onClick={() => window.history.back()} 
            className="mt-8 bg-primary text-white px-4 py-2 rounded hover:bg-accent1 transition-colors"
          >
            ← Back to Market Analysis
          </button>
        </div>
      </div>
    </div>
  );
}