// /frontend/services/articleService.ts
import { formatPublishDate } from '@/utils/dateFormatters';
import { supabase } from '@/utils/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

export interface ContentChild {
  type: string;
  text?: string;
  url?: string;
  children?: ContentChild[];
}

export interface ContentBlock {
  type: string;
  children: ContentChild[];
  image?: {
    url: string;
    caption?: string;
    alternativeText?: string;
  };
  level?: number;
  id?: number | string;
}

export interface ArticlePreview {
  id: number;
  documentId: string;
  title: string;
  content: ContentBlock[];
  author: string;
  publish_date: string;
  article_type: string;
  slug: string;
  excerpt: string;
  article_status: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  feature_image_url: any;
  article_images: {
    data: StrapiImage[];
  };
  isSample?: boolean;
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
  async getArticlePreviews(page = 1, pageSize = 10): Promise<PaginatedResponse<ArticlePreview>> {
    const url = `${API_URL}/api/content/articles?` + 
      new URLSearchParams({
        'pagination[page]': page.toString(),
        'pagination[pageSize]': pageSize.toString(),
        'filters[article_status][$eq]': 'published',
        'filters[publishedAt][$notNull]': 'true',
        'filters[article_type][$eq]': 'market-analysis',
        'sort[0]': 'publishedAt:desc'
      });

    console.log('Full URL with query params:', url);

    try {
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received Article Data:', data.data[0]);
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
      console.error('Error fetching from backend:', error);
      throw error;
    }
  },

  async getPopularArticles(limit = 5): Promise<ArticlePreview[]> {
    const url = `${API_URL}/api/content/articles?` +
      new URLSearchParams({
        'pagination[limit]': limit.toString(),
        'filters[article_status][$eq]': 'published',
        'filters[article_type][$eq]': 'market-analysis',
        'filters[publishedAt][$notNull]': 'true',
        'sort[0]': 'publishedAt:desc'
      });

    console.log('Full URL with query params for popular articles:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch popular articles');
    }

    const data = await response.json();
    return data.data.slice(0, 5);
  },

  async getArticleBySlug(slug: string): Promise<ArticlePreview | null> {
    const url = `${API_URL}/api/content/articles/${encodeURIComponent(slug)}`;
  
    try {
      let headers: HeadersInit = {};
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers = {
          'Authorization': `Bearer ${session.access_token}`
        };
      }
  
      console.log('Fetching article by slug:', slug);
      console.log('Auth headers:', session ? 'Token present' : 'No auth token');
  
      const response = await fetch(url, { 
        headers,
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Fetch error details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          url: url,
          headers: headers
        });
        if (response.status === 403) {
          const errorData = JSON.parse(errorText);
          if (errorData.article) {
            throw new Error('Access denied: Subscription required', { cause: errorData.article });
          }
          console.log('Authentication required or access denied for article:', slug);
          throw new Error('Access denied: Subscription required');
        }
        throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Article data received:', data ? 'Data found' : 'No data');
      
      if (!data) {
        return null;
      }
  
      return data;
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  async getSampleArticleBySlug(slug: string): Promise<ArticlePreview | null> {
    const url = `${API_URL}/api/content/articles/${encodeURIComponent(slug)}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch article: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching sample article:', error);
      throw error;
    }
  },

  async getInvestmentIdeasPreviews(page = 1, pageSize = 10): Promise<PaginatedResponse<ArticlePreview>> {
    const url = `${API_URL}/api/content/articles?` + 
      new URLSearchParams({
        'pagination[page]': page.toString(),
        'pagination[pageSize]': pageSize.toString(),
        'filters[article_status][$eq]': 'published',
        'filters[publishedAt][$notNull]': 'true',
        'filters[article_type][$eq]': 'investment-idea',
        'sort[0]': 'publishedAt:desc'
      });

    console.log('Full URL with query params for investment ideas:', url);

    try {
      const response = await fetch(url, { cache: 'no-store' });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend response error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch investment ideas: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching from backend:', error);
      throw error;
    }
  },

  async getPopularInvestmentIdeas(limit = 5): Promise<ArticlePreview[]> {
    const url = `${API_URL}/api/content/articles?` +
      new URLSearchParams({
        'pagination[limit]': limit.toString(),
        'filters[article_status][$eq]': 'published',
        'filters[article_type][$eq]': 'investment-idea',
        'filters[publishedAt][$notNull]': 'true',
        'sort[0]': 'publishedAt:desc'
      });

    console.log('Full URL with query params for popular investment ideas:', url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch popular investment ideas');
    }

    const data = await response.json();
    return data.data.slice(0, 5);
  },
};

export default articleService;