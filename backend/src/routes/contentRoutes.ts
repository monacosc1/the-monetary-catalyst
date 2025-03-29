// /backend/src/routes/contentRoutes.ts
import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import supabase from '../config/supabase';
import { TokenPayload } from '../types/auth';

interface Subscription {
  status: string;
}

// Extend Request type to include user (optional, for TypeScript safety)
declare module 'express' {
  interface Request {
    user?: any; // Adjust type based on Supabase user object if needed
  }
}

// Helper function to transform flat query params into nested Strapi-compatible URL params
const transformQueryParams = (query: any, prefix = ''): URLSearchParams => {
  const params = new URLSearchParams();

  for (const key in query) {
    if (query.hasOwnProperty(key)) {
      const value = query[key];
      const newKey = prefix ? `${prefix}[${key}]` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively handle nested objects
        const nestedParams = transformQueryParams(value, newKey);
        nestedParams.forEach((val, k) => {
          params.append(k, val);
        });
      } else if (Array.isArray(value)) {
        // Handle arrays (e.g., sort[0])
        value.forEach((item, index) => {
          params.append(`${newKey}[${index}]`, item);
        });
      } else {
        // Handle scalar values
        params.append(newKey, value);
      }
    }
  }

  return params;
};

// Handler for fetching a single article by slug
const getArticleHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Use Supabase to validate the token instead of jwtService
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        console.log('Supabase token validation failed:', { error: error?.message });
        res.status(401).json({ error: 'Invalid token', details: error?.message });
        return;
      }
      console.log('Supabase token validated successfully:', { userId: user.id });
      userId = user.id;
    } catch (error) {
      console.error('Error validating token with Supabase:', error);
      res.status(401).json({ error: 'Invalid token', details: (error as Error).message });
      return;
    }
  }

  try {
    const url = `${process.env.STRAPI_URL}/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`;
    console.log('Fetching from Strapi:', url);
    const strapiResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!strapiResponse.ok) {
      console.error('Strapi response not OK:', strapiResponse.status, strapiResponse.statusText);
      throw new Error(`Strapi API error: ${strapiResponse.statusText}`);
    }

    const data = await strapiResponse.json();
    console.log('Strapi response data:', data);
    const article = data.data?.[0];

    if (!article) {
      console.error('Article not found for slug:', slug);
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    // Process feature_image_url
    if (article.feature_image_url) {
      const strapiBaseUrl = process.env.STRAPI_URL || 'http://localhost:1337';
      if (typeof article.feature_image_url === 'object' && article.feature_image_url.url) {
        if (!article.feature_image_url.url.startsWith('http')) {
          article.feature_image_url.url = `${strapiBaseUrl}${article.feature_image_url.url}`;
          console.log('Transformed feature_image_url (direct):', article.feature_image_url.url);
        } else {
          console.log('Feature_image_url already absolute (direct):', article.feature_image_url.url);
        }
        if (article.feature_image_url.formats) {
          Object.keys(article.feature_image_url.formats).forEach(format => {
            const formatUrl = article.feature_image_url.formats[format]?.url;
            if (formatUrl && !formatUrl.startsWith('http')) {
              article.feature_image_url.formats[format].url = `${strapiBaseUrl}${formatUrl}`;
              console.log(`Transformed feature_image_url format (${format}):`, article.feature_image_url.formats[format].url);
            } else {
              console.log(`Feature_image_url format (${format}) already absolute:`, formatUrl);
            }
          });
        }
      } else if (article.feature_image_url.data && article.feature_image_url.data.attributes) {
        const attributes = article.feature_image_url.data.attributes;
        if (attributes.url && !attributes.url.startsWith('http')) {
          attributes.url = `${strapiBaseUrl}${attributes.url}`;
          console.log('Transformed feature_image_url (attributes):', attributes.url);
        } else {
          console.log('Feature_image_url already absolute (attributes):', attributes.url);
        }
        if (attributes.formats) {
          Object.keys(attributes.formats).forEach(format => {
            const formatUrl = attributes.formats[format]?.url;
            if (formatUrl && !formatUrl.startsWith('http')) {
              attributes.formats[format].url = `${strapiBaseUrl}${formatUrl}`;
              console.log(`Transformed feature_image_url format (${format}):`, attributes.formats[format].url);
            } else {
              console.log(`Feature_image_url format (${format}) already absolute:`, formatUrl);
            }
          });
        }
      }
    }

    // Handle article_images array the same way
    if (article.article_images && Array.isArray(article.article_images.data)) {
      article.article_images.data.forEach((image: any) => {
        const strapiBaseUrl = process.env.STRAPI_URL || 'http://localhost:1337';
        if (image.attributes && image.attributes.url && !image.attributes.url.startsWith('http')) {
          image.attributes.url = `${strapiBaseUrl}${image.attributes.url}`;
          console.log('Transformed article_image:', image.attributes.url);
        } else {
          console.log('Article_image already absolute:', image.attributes?.url);
        }
        if (image.attributes && image.attributes.formats) {
          Object.keys(image.attributes.formats).forEach(format => {
            const formatUrl = image.attributes.formats[format]?.url;
            if (formatUrl && !formatUrl.startsWith('http')) {
              image.attributes.formats[format].url = `${strapiBaseUrl}${formatUrl}`;
              console.log(`Transformed article_image format (${format}):`, image.attributes.formats[format].url);
            } else {
              console.log(`Article_image format (${format}) already absolute:`, formatUrl);
            }
          });
        }
      });
    }

    const isSample = article.isSample || false;

    let isSubscribed = false;
    if (userId) {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .single() as { data: Subscription | null; error: any };

      console.log('Subscription check:', { userId, subscription, error, isSubscribed });
      if (!error && subscription) {
        isSubscribed = subscription.status === 'active';
      }
    }

    if (isSample || isSubscribed) {
      res.json(article);
    } else {
      res.status(403).json({
        error: 'Subscription required',
        article: {
          title: article.title,
          publish_date: article.publish_date,
          author: article.author,
          feature_image_url: article.feature_image_url
        }
      });
    }
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handler for fetching a list of articles (previews or popular)
const getArticlesHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      // Use Supabase to validate the token instead of jwtService
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        console.log('Supabase token validation failed:', { error: error?.message });
        res.status(401).json({ error: 'Invalid token', details: error?.message });
        return;
      }
      console.log('Supabase token validated successfully:', { userId: user.id });
      userId = user.id;
    } catch (error) {
      console.error('Error validating token with Supabase:', error);
      res.status(401).json({ error: 'Invalid token', details: (error as Error).message });
      return;
    }
  }

  try {
    const queryParams = transformQueryParams(req.query);
    const url = new URL(`${process.env.STRAPI_URL}/api/articles?populate=*`);
    queryParams.forEach((value: string, key: string) => {
      url.searchParams.append(key, value);
    });

    console.log('Transformed URL:', url.toString());
    const strapiResponse = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!strapiResponse.ok) {
      console.error('Strapi response not OK:', strapiResponse.status, strapiResponse.statusText);
      throw new Error(`Strapi API error: ${strapiResponse.statusText}`);
    }

    const data = await strapiResponse.json();
    console.log('Strapi articles response data:', data);
    console.log('Raw feature_image_url for first article:', data.data[0]?.feature_image_url);

    // Process images for all articles
    const modifiedData = {
      ...data,
      data: data.data.map((article: any) => {
        if (article.feature_image_url) {
          const strapiBaseUrl = process.env.STRAPI_URL || 'http://localhost:1337';
          if (typeof article.feature_image_url === 'object' && article.feature_image_url.url) {
            if (!article.feature_image_url.url.startsWith('http')) {
              article.feature_image_url.url = `${strapiBaseUrl}${article.feature_image_url.url}`;
              console.log('Transformed feature_image_url (direct):', article.feature_image_url.url);
            } else {
              console.log('Feature_image_url already absolute (direct):', article.feature_image_url.url);
            }
            if (article.feature_image_url.formats) {
              Object.keys(article.feature_image_url.formats).forEach(format => {
                const formatUrl = article.feature_image_url.formats[format]?.url;
                if (formatUrl && !formatUrl.startsWith('http')) {
                  article.feature_image_url.formats[format].url = `${strapiBaseUrl}${formatUrl}`;
                  console.log(`Transformed feature_image_url format (${format}):`, article.feature_image_url.formats[format].url);
                } else {
                  console.log(`Feature_image_url format (${format}) already absolute:`, formatUrl);
                }
              });
            }
          } else if (article.feature_image_url.data && article.feature_image_url.data.attributes) {
            const attributes = article.feature_image_url.data.attributes;
            if (attributes.url && !attributes.url.startsWith('http')) {
              attributes.url = `${strapiBaseUrl}${attributes.url}`;
              console.log('Transformed feature_image_url (attributes):', attributes.url);
            } else {
              console.log('Feature_image_url already absolute (attributes):', attributes.url);
            }
            if (attributes.formats) {
              Object.keys(attributes.formats).forEach(format => {
                const formatUrl = attributes.formats[format]?.url;
                if (formatUrl && !formatUrl.startsWith('http')) {
                  attributes.formats[format].url = `${strapiBaseUrl}${formatUrl}`;
                  console.log(`Transformed feature_image_url format (${format}):`, attributes.formats[format].url);
                } else {
                  console.log(`Feature_image_url format (${format}) already absolute:`, formatUrl);
                }
              });
            }
          }
        }

        if (article.article_images && Array.isArray(article.article_images.data)) {
          article.article_images.data.forEach((image: any) => {
            const strapiBaseUrl = process.env.STRAPI_URL || 'http://localhost:1337';
            if (image.attributes && image.attributes.url && !image.attributes.url.startsWith('http')) {
              image.attributes.url = `${strapiBaseUrl}${image.attributes.url}`;
              console.log('Transformed article_image:', image.attributes.url);
            } else {
              console.log('Article_image already absolute:', image.attributes?.url);
            }
            if (image.attributes && image.attributes.formats) {
              Object.keys(image.attributes.formats).forEach(format => {
                const formatUrl = image.attributes.formats[format]?.url;
                if (formatUrl && !formatUrl.startsWith('http')) {
                  image.attributes.formats[format].url = `${strapiBaseUrl}${formatUrl}`;
                  console.log(`Transformed article_image format (${format}):`, image.attributes.formats[format].url);
                } else {
                  console.log(`Article_image format (${format}) already absolute:`, formatUrl);
                }
              });
            }
          });
        }

        return article;
      }),
    };

    console.log('Transformed feature_image_url for first article:', modifiedData.data[0]?.feature_image_url);
    res.json(modifiedData);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const router = Router();
router.get('/articles/:slug', getArticleHandler);
router.get('/articles', getArticlesHandler);

export default router;