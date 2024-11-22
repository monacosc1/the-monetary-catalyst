import { formatPublishDate } from '@/utils/dateFormatters';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

interface ImageFormat {
  ext: string;
  url: string;
  hash: string;
  mime: string;
  name: string;
  size: number;
  width: number;
  height: number;
}

export interface StrapiImage {
  id: number;
  attributes: {
    url: string;
    caption?: string;
    formats?: {
      large?: ImageFormat;
      small?: ImageFormat;
      medium?: ImageFormat;
      thumbnail?: ImageFormat;
    };
  };
}

export interface ArticlePreview {
  id: number;
  documentId: string;
  title: string;
  content: any[];
  author: string;
  publish_date: string;
  article_type: string;
  slug: string;
  excerpt: string;
  article_status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  feature_image_url: {
    data: {
      id: number;
      attributes: {
        name: string;
        url: string;
        formats: {
          large?: { url: string };
          small?: { url: string };
          medium?: { url: string };
          thumbnail?: { url: string };
        };
      };
    };
  };
  article_images: {
    data: StrapiImage[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

const articleService = {
  /**
   * Get paginated list of published article previews
   */
  async getArticlePreviews(page = 1, pageSize = 10): Promise<PaginatedResponse<ArticlePreview>> {
    const url = `${STRAPI_URL}/api/articles?` + 
      new URLSearchParams({
        'pagination[page]': page.toString(),
        'pagination[pageSize]': pageSize.toString(),
        'populate': '*',
        'filters[article_status][$eq]': 'published',
        'filters[publishedAt][$notNull]': 'true',
        'filters[article_type][$eq]': 'market-analysis',
        'sort[0]': 'publishedAt:desc'
      });

    console.log('Fetching from URL:', url);

    try {
      const response = await fetch(url, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Strapi response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Article Previews Response Structure:', {
        fullResponse: data,
        sampleArticle: data.data[0] ? {
          hasAttributes: 'attributes' in data.data[0],
          topLevelKeys: Object.keys(data.data[0]),
          fullArticle: data.data[0],
          featureImageUrl: JSON.stringify(data.data[0].feature_image_url, null, 2)
        } : 'No articles found'
      });
      console.log('Article date debug:', {
        firstArticleDate: data.data[0]?.publish_date,
        formattedDate: formatPublishDate(data.data[0]?.publish_date),
        rawDate: new Date(data.data[0]?.publish_date).toISOString()
      });
      return data;
    } catch (error) {
      console.error('Error fetching from Strapi:', error);
      throw error;
    }
  },

  /**
   * Get popular articles for sidebar
   */
  async getPopularArticles(limit = 3): Promise<ArticlePreview[]> {
    const response = await fetch(
      `${STRAPI_URL}/api/articles?` +
      new URLSearchParams({
        'pagination[limit]': limit.toString(),
        'filters[article_status][$eq]': 'published',
        'filters[article_type][$eq]': 'market-analysis',
        'sort[0]': 'publish_date:desc'
      })
    );

    if (!response.ok) {
      throw new Error('Failed to fetch popular articles');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Get full article by slug
   */
  async getArticleBySlug(slug: string): Promise<ArticlePreview | null> {
    const url = `${STRAPI_URL}/api/articles?` + 
      new URLSearchParams({
        'filters[slug][$eq]': slug,
        'populate': '*'  // Populate all relations including article_images
      });

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Single Article Response Structure:', {
        fullResponse: data,
        articleData: data.data[0] ? {
          hasAttributes: 'attributes' in data.data[0],
          topLevelKeys: Object.keys(data.data[0]),
          fullArticle: data.data[0]
        } : 'No article found'
      });
      
      if (!data.data || data.data.length === 0) {
        return null;
      }

      return data.data[0];
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }
};

export default articleService; 