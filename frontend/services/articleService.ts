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
    id: number;
    name: string;
    url: string;
    formats: {
      large?: { url: string };
      small?: { url: string };
      medium?: { url: string };
      thumbnail?: { url: string };
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
        'populate': 'feature_image_url',
        'filters[article_status][$eq]': 'published',
        'sort[0]': 'publish_date:desc'
      });

    console.log('Fetching from URL:', url);

    try {
      const response = await fetch(url);
      
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
      console.log('Strapi response data (detailed):', JSON.stringify(data, null, 2));
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
      console.log('Article detail data:', JSON.stringify(data, null, 2));
      
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