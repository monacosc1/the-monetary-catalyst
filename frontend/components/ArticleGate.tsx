'use client'

import Link from 'next/link';
import Image from 'next/image';

interface ArticleGateProps {
  title: string;
  publishDate: string;
  author: string;
  featureImageUrl?: string;
  strapiUrl?: string;
  isLoggedIn?: boolean;
}

export default function ArticleGate({ 
  title, 
  publishDate, 
  author,
  featureImageUrl,
  strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || '',
  isLoggedIn = false
}: ArticleGateProps) {
  return (
    <div className="relative">
      {/* Preview content */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">
          {publishDate} by {author}
        </p>
        
        {/* Feature Image */}
        {featureImageUrl && (
          <div className="relative">
            <Image 
              src={`${strapiUrl}${featureImageUrl}`}
              alt={title}
              width={800}
              height={400}
              className="rounded-lg mb-8"
            />
          </div>
        )}
      </div>

      {/* Overlay with blur effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-white pointer-events-none" 
        style={{ top: '250px' }}
      />

      {/* Subscribe/Login box */}
      <div className="bg-gray-100 p-6 rounded-lg mt-4 text-center">
        <p className="text-gray-700">
          {isLoggedIn ? (
            <>
              <Link href="/pricing" className="text-primary hover:text-accent1 font-semibold">
                Subscribe
              </Link>
              <span className="text-gray-700"> to read the rest of this content</span>
            </>
          ) : (
            <>
              <Link href="/pricing" className="text-primary hover:text-accent1 font-semibold">
                Subscribe
              </Link>
              <span className="text-gray-700"> or log in to read the rest of this content.</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
} 