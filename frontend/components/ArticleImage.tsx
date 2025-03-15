'use client';

import Image from 'next/image';
import { useState } from 'react';

interface StrapiImage {
  data?: {
    attributes?: {
      url?: string;
      formats?: {
        small?: {
          url?: string;
        };
        medium?: {
          url?: string;
        };
        thumbnail?: {
          url?: string;
        };
      };
    };
  };
  url?: string;
  // Add these for direct access after backend transformation
  id?: number;
  formats?: {
    small?: {
      url?: string;
    };
    medium?: {
      url?: string;
    };
    thumbnail?: {
      url?: string;
    };
  };
}

interface ArticleImageProps {
  imageUrl: StrapiImage | string;
  title: string;
  className?: string;
}

export default function ArticleImage({ imageUrl, title, className }: ArticleImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Debug the incoming data structure
  console.log('ArticleImage received:', JSON.stringify(imageUrl, null, 2));
  
  let imageSource = '';
  
  // Handle string (direct URL from backend)
  if (typeof imageUrl === 'string') {
    imageSource = imageUrl;
  } 
  // Handle object (either original Strapi structure or transformed backend structure)
  else if (imageUrl) {
    // Try nested Strapi structure first
    if (imageUrl.data?.attributes?.formats?.small?.url) {
      imageSource = imageUrl.data.attributes.formats.small.url;
    } else if (imageUrl.data?.attributes?.formats?.medium?.url) {
      imageSource = imageUrl.data.attributes.formats.medium.url;
    } else if (imageUrl.data?.attributes?.formats?.thumbnail?.url) {
      imageSource = imageUrl.data.attributes.formats.thumbnail.url;
    } else if (imageUrl.data?.attributes?.url) {
      imageSource = imageUrl.data.attributes.url;
    } 
    // Try backend transformed structure
    else if (imageUrl.formats?.small?.url) {
      imageSource = imageUrl.formats.small.url;
    } else if (imageUrl.formats?.medium?.url) {
      imageSource = imageUrl.formats.medium.url;
    } else if (imageUrl.formats?.thumbnail?.url) {
      imageSource = imageUrl.formats.thumbnail.url;
    } else if (imageUrl.url) {
      imageSource = imageUrl.url;
    }
  }
  
  console.log('Resolved image source:', imageSource);
  
  // If we don't have a valid image source, show a placeholder
  if (!imageSource || imageError) {
    return (
      <div 
        className={`h-48 w-full bg-gray-200 flex items-center justify-center md:w-48 ${className || ''}`}
      >
        <span className="text-gray-400">No Image</span>
      </div>
    );
  }
  
  // If the URL isn't absolute, it's a problem since it needs to be
  if (!imageSource.startsWith('http')) {
    console.error('Invalid image URL (not absolute):', imageSource);
    // Try to create a complete URL if possible
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    imageSource = `${strapiUrl}${imageSource.startsWith('/') ? '' : '/'}${imageSource}`;
    console.log('Attempted to fix URL:', imageSource);
  }
  
  return (
    <Image
      src={imageSource}
      alt={title || 'Article image'}
      width={300}
      height={200}
      className={`h-48 w-full object-cover md:w-48 ${className || ''}`}
      priority
      onError={(e) => {
        console.error('Image load error:', e);
        const img = e.target as HTMLImageElement;
        console.log('Failed URL:', img.src);
        setImageError(true);
      }}
    />
  );
}