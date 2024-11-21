'use client';

import Image from 'next/image';

interface ArticleImageProps {
  imageUrl: any;
  title: string;
  strapiUrl: string;
}

export default function ArticleImage({ imageUrl, title, strapiUrl }: ArticleImageProps) {
  const imageSource = imageUrl?.formats?.small?.url || imageUrl?.url;
  
  return (
    <Image
      src={imageSource ? `${strapiUrl}${imageSource}` : "/images/placeholder.png"}
      alt={title || 'Article image'}
      width={300}
      height={200}
      className="h-48 w-full object-cover md:w-48"
      priority
      onError={(e) => {
        console.error('Image load error:', e);
        const img = e.target as HTMLImageElement;
        console.log('Failed URL:', img.src);
      }}
    />
  );
} 