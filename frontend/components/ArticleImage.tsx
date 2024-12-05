'use client';

import Image from 'next/image';

interface ArticleImageProps {
  imageUrl: any;
  title: string;
  strapiUrl: string;
  className?: string;
}

export default function ArticleImage({ imageUrl, title, strapiUrl, className }: ArticleImageProps) {
  console.log('ArticleImage debug:', {
    original: imageUrl?.data?.attributes?.url,
    cleaned: (imageUrl?.data?.attributes?.url || '').replace(strapiUrl, ''),
    final: `${strapiUrl}${(imageUrl?.data?.attributes?.url || '').replace(strapiUrl, '')}`
  });
  
  const imageSource = (imageUrl?.data?.attributes?.formats?.small?.url || 
                      imageUrl?.data?.attributes?.url ||
                      imageUrl?.url || '')
                      .replace(strapiUrl, '');
  
  console.log('Resolved imageSource:', imageSource);
  
  const fullImageUrl = imageSource.startsWith('http') 
    ? imageSource 
    : `${strapiUrl}${imageSource.startsWith('/') ? '' : '/'}${imageSource}`;

  console.log('Full image URL:', fullImageUrl);
  
  return (
    <Image
      src={fullImageUrl}
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