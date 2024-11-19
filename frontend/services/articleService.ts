import { supabase } from '@/utils/supabase';

// Types for article data
export interface ArticlePreview {
  id: string;
  title: string;
  excerpt: string;
  publish_date: string;
  slug: string;
  article_status: string;
  article_type: string;
  published_at: string;
  document_id: string;
}

// New interface for minimal article data
export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
}

export interface ArticleContent {
  type: 'paragraph' | 'image';
  content?: string;
  url?: string;
  caption?: string;
}

export interface FullArticle extends ArticlePreview {
  content: ArticleContent[];
  author: string;
  updated_at: string;
  created_at: string;
  created_by_id: string;
  updated_by_id: string;
  locale: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

const articleService = {
  /**
   * Get paginated list of published article previews
   */
  async getArticlePreviews(page = 1, pageSize = 10): Promise<PaginatedResponse<ArticlePreview>> {
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    const { data, error, count } = await supabase
      .from('articles')
      .select(`
        id, 
        title, 
        excerpt, 
        publish_date, 
        slug, 
        article_status,
        article_type,
        published_at,
        document_id
      `, { count: 'exact' })
      .eq('article_status', 'published')
      .not('published_at', 'is', null)
      .order('publish_date', { ascending: false })
      .range(start, end);

    console.log('Raw Supabase Response:', { data, error, count });
    
    if (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }

    // Format dates to local timezone
    const formattedData = data?.map(article => ({
      ...article,
      publish_date: new Date(article.publish_date).toISOString().split('T')[0]
    }));

    return {
      data: formattedData || [],
      count: count || 0
    };
  },

  /**
   * Get full article content by slug
   */
  async getArticleBySlug(slug: string): Promise<FullArticle | null> {
    const { data, error } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        excerpt,
        publish_date,
        slug,
        article_status,
        article_type,
        content,
        author,
        updated_at,
        created_at,
        published_at,
        document_id,
        created_by_id,
        updated_by_id,
        locale
      `)
      .eq('slug', slug)
      .eq('article_status', 'published')
      .not('published_at', 'is', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error fetching article:', error);
      throw error;
    }

    return data;
  },

  /**
   * Get popular articles for sidebar
   */
  async getPopularArticles(limit = 3): Promise<ArticleListItem[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug')
      .eq('article_status', 'published')
      .not('published_at', 'is', null)
      .order('publish_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular articles:', error);
      throw error;
    }

    return data || [];
  }
};

export default articleService; 