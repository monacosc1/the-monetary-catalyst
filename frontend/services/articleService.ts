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
  async getPopularArticles(limit = 5): Promise<ArticlePreview[]> {
    const response = await fetch(
      `${STRAPI_URL}/api/articles?` +
      new URLSearchParams({
        'pagination[limit]': limit.toString(),
        'filters[article_status][$eq]': 'published',
        'filters[article_type][$eq]': 'market-analysis',
        'filters[publishedAt][$notNull]': 'true',
        'sort[0]': 'publishedAt:desc'
      })
    );

    if (!response.ok) {
      throw new Error('Failed to fetch popular articles');
    }

    const data = await response.json();
    return data.data.slice(0, 5);
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
  },

  /**
   * Get paginated list of published investment idea previews
   */
  async getInvestmentIdeasPreviews(page = 1, pageSize = 10): Promise<PaginatedResponse<ArticlePreview>> {
    const url = `${STRAPI_URL}/api/articles?` + 
      new URLSearchParams({
        'pagination[page]': page.toString(),
        'pagination[pageSize]': pageSize.toString(),
        'populate': '*',
        'filters[article_status][$eq]': 'published',
        'filters[publishedAt][$notNull]': 'true',
        'filters[article_type][$eq]': 'investment-idea',
        'sort[0]': 'publishedAt:desc'
      });

    console.log('Fetching investment ideas from URL:', url);

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
        throw new Error(`Failed to fetch investment ideas: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching from Strapi:', error);
      throw error;
    }
  },

  /**
   * Get popular investment idea articles for sidebar
   */
  async getPopularInvestmentIdeas(limit = 5): Promise<ArticlePreview[]> {
    const response = await fetch(
      `${STRAPI_URL}/api/articles?` +
      new URLSearchParams({
        'pagination[limit]': limit.toString(),
        'filters[article_status][$eq]': 'published',
        'filters[article_type][$eq]': 'investment-idea',
        'filters[publishedAt][$notNull]': 'true',
        'sort[0]': 'publishedAt:desc'
      })
    );

    if (!response.ok) {
      throw new Error('Failed to fetch popular investment ideas');
    }

    const data = await response.json();
    return data.data.slice(0, 5);
  },

  async getArticleById(id: number) {
    const url = `${STRAPI_URL}/api/articles/${id}?` + 
      new URLSearchParams({
        'populate': '*'  // This will populate all first-level relations
      });

    console.log('Fetching article with URL:', url);

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
        throw new Error(`Failed to fetch article: ${response.status}`);
      }

      const data = await response.json();
      console.log('Article data received:', {
        fullData: data,
        articleData: data.data,
        content: data.data?.attributes?.content,
        featureImage: data.data?.attributes?.feature_image_url,
        articleImages: data.data?.attributes?.article_images
      });

      if (!data.data) {
        throw new Error('Article not found');
      }

      // Transform the data to match the expected format
      const article = data.data.attributes;
      return {
        id: data.data.id,
        title: article.title,
        content: article.content || [],
        author: article.author,
        publish_date: article.publish_date,
        feature_image_url: article.feature_image_url,
        article_images: article.article_images,
      };
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  },

  // Add this temporary debug method
  async getAllArticleIds() {
    const url = `${STRAPI_URL}/api/articles?` + 
      new URLSearchParams({
        'fields[0]': 'id',
        'fields[1]': 'title',
        'pagination[pageSize]': '100'
      });

    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log('All articles:', data.data.map((article: any) => ({
        id: article.id,
        title: article.title
      })));
      return data;
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  // Add this new method specifically for sample articles
  async getSampleArticleById(id: number) {
    const url = `${STRAPI_URL}/api/articles?` + 
      new URLSearchParams({
        'filters[id][$eq]': id.toString(),
        'populate': '*'
      });

    console.log('1. Starting fetch for sample article:', {
      id,
      url
    });

    try {
      const response = await fetch(url, {
        cache: 'no-store'
      });
      
      console.log('2. Response status:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('3. Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch sample article: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sample Article Raw Data:', {
        content: data.data[0].content,
        contentStructure: data.data[0].content.map((item: any) => ({
          type: item.type,
          hasChildren: !!item.children,
          childrenTypes: item.children?.map((c: any) => c.type)
        }))
      });
      
      if (!data.data?.[0]) {
        console.error('5. No article found in response');
        throw new Error('Sample article not found');
      }

      // The article data is directly in data.data[0], not in attributes
      const article = data.data[0];
      console.log('6. Article data:', {
        article,
        availableFields: Object.keys(article || {})
      });

      // Transform the data to match the expected format
      const transformedArticle = {
        id: article.id,
        title: article.title,
        content: article.content || [],
        author: article.author,
        publish_date: article.publish_date,
        feature_image_url: article.feature_image_url,
        article_images: article.article_images,
      };

      console.log('7. Transformed article:', transformedArticle);
      return transformedArticle;

    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('8. Error in getSampleArticleById:', {
          error: error.toString(),
          errorMessage: error.message,
          errorStack: error.stack
        });
      } else {
        console.error('8. Unknown error in getSampleArticleById:', error);
      }
      throw error;
    }
  }
};

export default articleService; 