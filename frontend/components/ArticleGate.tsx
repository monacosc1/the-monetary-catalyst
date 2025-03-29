// /frontend/components/ArticleGate.tsx
'use client'

import Link from 'next/link';
import Image from 'next/image';

interface ArticleGateProps {
  title: string;
  publishDate: string;
  author: string;
  featureImageUrl?: string;
  isLoggedIn?: boolean;
}

export default function ArticleGate({ 
  title, 
  publishDate, 
  author,
  featureImageUrl,
  isLoggedIn = false
}: ArticleGateProps) {
  return (
    <div className="relative">
      {/* Preview content with fixed height */}
      <div className="mb-8 relative">
        <h1 className="text-4xl font-bold mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">
          {publishDate} by {author}
        </p>
        
        {/* Feature Image */}
        {featureImageUrl && (
          <div className="relative">
            <Image 
              src={featureImageUrl}
              alt={title}
              width={800}
              height={400}
              className="rounded-lg mb-8"
            />
          </div>
        )}

        {/* Overlay with blur effect, positioned to cover only the preview content */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-white pointer-events-none" 
          style={{ top: '150px' }} // Adjusted to start earlier, ensuring CTA is visible
        />
      </div>

      {/* Subscribe/Login box */}
      <div className="bg-gray-100 p-6 rounded-lg mt-4 text-center relative z-10">
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
              <span className="text-gray-700"> or </span>
              <Link href="/login" className="text-primary hover:text-accent1 font-semibold">
                log in
              </Link>
              <span className="text-gray-700"> to read the rest of this content.</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}