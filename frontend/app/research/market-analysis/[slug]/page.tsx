'use client'

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fullArticles } from '@/mockData/fullArticles';
import DotPattern from '@/components/DotPattern';

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const article = fullArticles.find(a => a.slug === params.slug);

  if (!article) {
    return <div>Article not found</div>;
  }

  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-white text-black p-8 rounded-lg shadow-xl">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          <p className="text-gray-600 mb-4">By {article.author} | Published on {article.publish_date}</p>
          <Image 
            src={article.image_url} 
            alt={article.title} 
            width={800} 
            height={400} 
            className="mb-8 rounded-lg"
          />
          {article.content.map((item, index) => (
            item.type === 'paragraph' ? (
              <p key={index} className="mb-4">{item.content}</p>
            ) : item.type === 'image' ? (
              <div key={index} className="mb-8">
                <Image 
                  src={item.url || '/images/placeholder.png'} 
                  alt={item.caption || 'Image'} 
                  width={600} 
                  height={400} 
                  className="rounded-lg"
                />
                {item.caption && <p className="text-sm text-gray-600 mt-2">{item.caption}</p>}
              </div>
            ) : null
          ))}
          <button 
            onClick={() => router.back()} 
            className="mt-8 bg-primary text-white px-4 py-2 rounded hover:bg-accent1 transition-colors"
          >
            ← Back to Market Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
