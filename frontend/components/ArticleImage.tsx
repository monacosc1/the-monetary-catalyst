'use client';

import Image from 'next/image';

interface ArticleImageProps {
  imageUrl: any;
  title: string;
  strapiUrl: string;
  className?: string;
}

export default function ArticleImage({ imageUrl, title, strapiUrl, className }: ArticleImageProps) {
  console.log('ArticleImage received imageUrl:', JSON.stringify(imageUrl, null, 2));
  
  const imageSource = imageUrl?.data?.attributes?.formats?.small?.url || 
                     imageUrl?.data?.attributes?.url ||
                     imageUrl?.url;
  
  console.log('Resolved imageSource:', imageSource);
  
  return (
    <Image
      src={imageSource ? `${strapiUrl}${imageSource}` : "https://via.placeholder.com/300x200"}
      alt={title || 'Article image'}
      width={300}
      height={200}
      className={`h-48 w-full object-cover md:w-48 ${className || ''}`}
      priority
      onError={(e) => {
        console.error('Image load error:', e);
        const img = e.target as HTMLImageElement;
        console.log('Failed URL:', img.src);
        img.src = "https://via.placeholder.com/300x200";
      }}
    />
  );
} 