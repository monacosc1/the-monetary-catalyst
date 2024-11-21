'use client'

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DotPattern from '@/components/DotPattern';
import articleService, { StrapiImage } from '@/services/articleService';

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  try {
    const article = await articleService.getArticleBySlug(params.slug);

    if (!article) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl">Article not found</h2>
          <p>The article you're looking for doesn't exist or has been removed.</p>
        </div>
      );
    }

    return (
      <div className="bg-background-dark text-white min-h-screen py-12 relative">
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10">
          <div className="bg-white text-black p-8 rounded-lg shadow-xl">
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <p className="text-gray-600 mb-4">
              By {article.author} | Published on {new Date(article.publish_date).toLocaleDateString()}
            </p>
            
            {/* Feature Image */}
            {article.feature_image_url && (
              <Image 
                src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${article.feature_image_url.url}`}
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

              return null;
            })}

            {/* Article Images */}
            {article?.article_images?.data?.map((image: StrapiImage, index: number) => (
              <div key={index} className="mb-8">
                <Image 
                  src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${image.attributes.url}`}
                  alt={`Article image ${index + 1}`}
                  width={600}
                  height={400}
                  className="rounded-lg"
                />
                {image.attributes.caption && (
                  <p className="text-sm text-gray-600 mt-2">{image.attributes.caption}</p>
                )}
              </div>
            ))}

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
  } catch (error) {
    console.error('Error in ArticlePage:', error);
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl">Error loading article</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
      </div>
    );
  }
}
