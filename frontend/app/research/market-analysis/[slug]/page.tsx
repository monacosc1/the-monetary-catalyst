'use client'

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import DotPattern from '@/components/DotPattern';
import ArticleGate from '@/components/ArticleGate';
import articleService, { StrapiImage } from '@/services/articleService';
import { formatPublishDate } from '@/utils/dateFormatters';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchArticleAndSubscription = async () => {
      try {
        // Fetch article data
        const articleData = await articleService.getArticleBySlug(params.slug);
        setArticle(articleData);

        // Check subscription status if user is logged in
        if (user) {
          const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .single();

          if (!error && subscription) {
            setHasActiveSubscription(subscription.status === 'active');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticleAndSubscription();
  }, [params.slug, user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!article) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl">Article not found</h2>
        <p>The article you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  // Helper function to clean image URLs
  const getCleanImageUrl = (imageData: any) => {
    if (!imageData) return null;
    
    const rawUrl = imageData.data?.attributes?.url || imageData.url;
    if (!rawUrl) return null;

    const cleanUrl = rawUrl.replace(/^http:\/\/localhost:1337/, '');
    return `${process.env.NEXT_PUBLIC_STRAPI_URL}${cleanUrl}`;
  };

  // Get feature image URL
  const featureImageUrl = getCleanImageUrl(article.feature_image_url);

  // If user is not logged in or doesn't have an active subscription, show gated content
  if (!hasActiveSubscription) {
    return (
      <div className="bg-background-dark text-white min-h-screen py-12 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white text-black p-8 rounded-lg shadow-xl">
            <ArticleGate
              title={article.title}
              publishDate={formatPublishDate(article.publish_date)}
              author={article.author}
              featureImageUrl={article.feature_image_url?.data?.attributes?.url}
              isLoggedIn={!!user}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full article content for subscribed users
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
          {article.content.map((block: any, index: number) => {
            if (block.type === 'paragraph') {
              return (
                <p key={index} className="mb-4">
                  {block.children.map((child: any, childIndex: number) => {
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
                          {child.children[0].text || 'Link'}
                        </a>
                      );
                    }
                    return null;
                  })}
                </p>
              );
            }
            
            if (block.type === 'heading') {
              const HeadingTag = `h${block.level}` as keyof JSX.IntrinsicElements;
              return (
                <HeadingTag key={index} className="text-2xl font-bold mt-6 mb-4">
                  {block.children[0].text}
                </HeadingTag>
              );
            }

            if (block.type === 'image') {
              const imageUrl = getCleanImageUrl(block.image);
              return imageUrl ? (
                <div key={index} className="my-8">
                  <Image
                    src={imageUrl}
                    alt={block.image.alternativeText || 'Article image'}
                    width={800}
                    height={400}
                    className="rounded-lg mx-auto"
                  />
                  {block.image.caption && (
                    <p className="text-sm text-gray-600 text-center mt-2">
                      {block.image.caption}
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
