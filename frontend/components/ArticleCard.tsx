import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ArticleCardProps {
  title: string;
  date: string;
  imageUrl: string;
  excerpt: string;
  slug: string;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, date, imageUrl, excerpt, slug }) => {
  return (
    <div className="bg-gray-100 rounded-lg shadow-xl overflow-hidden">
      <div className="md:flex">
        <div className="md:flex-shrink-0">
          <Image
            src={imageUrl}
            alt={title}
            width={300}
            height={200}
            className="h-48 w-full object-cover md:w-48"
          />
        </div>
        <div className="p-8">
          <p className="text-sm text-gray-600 mb-1">{date}</p>
          <h2 className="text-2xl font-semibold text-black mb-2">{title}</h2>
          <p className="text-gray-700 mb-4">{excerpt}</p>
          <Link 
            href={`/research/market-analysis/${slug}`}
            className="text-primary hover:text-accent1 font-semibold"
          >
            Read More →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ArticleCard;
