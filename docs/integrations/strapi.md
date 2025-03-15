# Strapi Integration Documentation: The Monetary Catalyst

## Overview

This document provides a comprehensive explanation of how Strapi CMS integrates with The Monetary Catalyst platform. We'll focus on the architecture, content gating mechanism, and key files that enable our subscription-based content model.

## Core Functionality

The Monetary Catalyst implements a hybrid content model with two primary content access patterns:

1. **Sample Articles**:
   - Available to all users (unauthenticated, authenticated but not subscribed, and subscribed)
   - Designated using an `isSample` boolean field in Strapi
   - Consist of one sample from each content category ("market-analysis" and "investment-ideas")

2. **Premium Articles**:
   - Only available to authenticated users with active subscriptions
   - Access controlled via the backend service
   - Subscription status verified through Supabase

## Architecture Overview

The project follows a monorepo structure with three primary components:

```
monetary-catalyst/
├── frontend/                   # Next.js 14 frontend application
├── backend/                    # Express.js backend API
└── cms/                        # Strapi CMS
```

### Key Integration Points

1. **Content Management**: Strapi CMS serves as the content repository for all articles
2. **User Authentication**: Supabase handles user authentication and stores subscription status
3. **Access Control**: Backend Express API enforces article access rules based on authentication and subscription status
4. **Content Delivery**: Frontend Next.js application renders content based on access permissions

## Security Architecture

Our architecture implements a server-side access control model:

1. Frontend requests article content from our backend API, not directly from Strapi
2. Backend API verifies authentication status using JWT token from Supabase
3. Backend checks subscription status in Supabase database for authenticated users
4. Backend fetches content from Strapi using a server-side API token
5. Content is only returned to the frontend if access rules are satisfied

This approach eliminates client-side security vulnerabilities by centralizing access control in the backend.

## Key Files and Components

### Backend Files

1. **Content Routes** (`/backend/src/routes/contentRoutes.ts`):
   - Defines API endpoints for article access
   - Implements the central content gating logic
   - `/api/content/articles/:slug` endpoint handles article requests

```typescript
// Excerpt from /backend/src/routes/contentRoutes.ts
router.get('/articles/:slug', async (req, res) => {
  // Verify authentication
  const userId = req.user?.id;
  
  // Fetch article from Strapi
  const article = await fetchFromStrapi(slug);
  
  // Check if article is a sample
  const isSample = article.attributes?.isSample || false;
  
  // Check subscription if not a sample
  if (!isSample) {
    const hasSubscription = await checkSubscription(userId);
    if (!hasSubscription) {
      return res.status(403).json({ error: 'Subscription required' });
    }
  }
  
  // Return article to authorized users
  return res.json(article);
});
```

2. **Authentication Middleware** (`/backend/src/middleware/authMiddleware.ts`):
   - Verifies JWT tokens from request headers
   - Adds user information to request object for downstream handlers

3. **JWT Service** (`/backend/src/services/jwtService.ts`):
   - Handles token verification and generation
   - Used by auth middleware to validate request authentication

4. **Supabase Configuration** (`/backend/src/config/supabase.ts`):
   - Configures Supabase client for backend access
   - Used to query subscription status

### Frontend Files

1. **Article Service** (`/frontend/services/articleService.ts`):
   - Handles API calls to the backend for article content
   - Manages article data formatting

```typescript
// Excerpt from /frontend/services/articleService.ts
async getArticleBySlug(slug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  let headers = {};
  
  // Add authentication token if available
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers = {
      'Authorization': `Bearer ${session.access_token}`
    };
  }
  
  try {
    const response = await fetch(`${apiUrl}/api/content/articles/${slug}`, { headers });
    if (!response.ok) {
      // Handle access denied or other errors
      return null;
    }
    
    const data = await response.json();
    return data.article;
  } catch (error) {
    console.error('Error fetching article:', error);
    throw error;
  }
}
```

2. **Article Pages**:
   - Premium Article Pages (`/frontend/app/research/market-analysis/[slug]/page.tsx` and `/frontend/app/research/investment-ideas/[slug]/page.tsx`):
     - Display full articles for subscribed users
     - Show "ArticleGate" component for non-subscribed users
   
   - Sample Article Pages (`/frontend/app/samples/market-analysis-sample/page.tsx` and `/frontend/app/samples/investment-ideas-sample/page.tsx`):
     - Display sample articles for all visitors

3. **Article Gate Component** (`/frontend/components/ArticleGate.tsx`):
   - Shown when a non-subscribed user attempts to view premium content
   - Displays article preview with call-to-action for subscription

4. **Auth Context** (`/frontend/context/AuthContext/index.tsx`):
   - Manages authentication state
   - Provides user information to components

5. **Subscription Details Component** (`/frontend/components/SubscriptionDetails.tsx`):
   - Displays information about user's subscription
   - Manages subscription-related actions

### Strapi Configuration

1. **Content Type Definition** (`/cms/src/api/article/content-types/article/schema.json`):
   - Defines the Article content type structure
   - Includes the `isSample` boolean field for designating sample articles

```json
// Excerpt from schema.json showing isSample field
{
  "attributes": {
    "isSample": {
      "type": "boolean",
      "default": false
    },
    // other fields...
  }
}
```

2. **API Token Configuration**:
   - Backend read-only token with access to Article content
   - Used by backend to make authenticated requests to Strapi

3. **CORS Configuration** (`/cms/config/middleware.js`):
   - Configures allowed origins for API requests
   - Ensures secure cross-origin communication

## Data Flow

### Authentication Flow

1. User logs in via frontend (using Supabase Auth)
2. Supabase returns JWT token stored in browser
3. Token is included in subsequent API requests to backend
4. Backend verifies token and identifies user

### Article Request Flow

1. **For Premium Content**:
   - User navigates to article page (`/research/market-analysis/[slug]`)
   - Frontend calls backend API with user's auth token
   - Backend verifies token and checks subscription status
   - If subscribed, backend fetches article from Strapi and returns it
   - If not subscribed, backend returns 403 Forbidden
   - Frontend displays either full article or gated preview

2. **For Sample Content**:
   - User navigates to sample page (`/samples/market-analysis-sample`)
   - Frontend calls backend API (with or without auth token)
   - Backend identifies the article as a sample via `isSample` field
   - Backend returns article content regardless of subscription status
   - Frontend displays the full sample article

## Environment Configuration

### Backend Environment Variables

```
# Strapi Configuration
STRAPI_URL=https://cms.themonetarycatalyst.com
STRAPI_API_TOKEN=<backend-read-only-token>

# Supabase Configuration
SUPABASE_URL=https://mvpkomkszkkxlmbvzhjr.supabase.co
SUPABASE_API_KEY=<supabase-service-role-key>
```

### Frontend Environment Variables

```
# API Configuration
NEXT_PUBLIC_API_URL=https://api.themonetarycatalyst.com
NEXT_PUBLIC_STRAPI_URL=https://cms.themonetarycatalyst.com

# Supabase Configuration (for client-side auth)
NEXT_PUBLIC_SUPABASE_URL=https://mvpkomkszkkxlmbvzhjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Subscription Management

Subscription status is managed through:

1. **Stripe Integration**:
   - Handles payment processing
   - Webhook events update Supabase subscription records

2. **Supabase Database**:
   - Stores subscription records in `subscriptions` table
   - Key fields: `user_id`, `status`, `plan_type`, `end_date`

3. **Backend Subscription Check**:
   ```typescript
   // Pseudo-code for subscription verification
   async function checkSubscription(userId) {
     if (!userId) return false;
     
     const { data: subscription } = await supabase
       .from('subscriptions')
       .select('status')
       .eq('user_id', userId)
       .single();
       
     return subscription?.status === 'active';
   }
   ```

## Implementation Process

Our implementation involved these key steps:

1. Adding `isSample` field to Strapi Article content type
2. Creating a backend API route for article access
3. Creating a server-side API token in Strapi
4. Updating the frontend to fetch articles through the backend
5. Setting proper environment variables
6. Marking sample articles with `isSample = true` in Strapi

## Testing

To verify the integration works correctly, test these scenarios:

1. **Unauthenticated User**:
   - Should be able to view sample articles
   - Should see gated preview for premium articles

2. **Authenticated User Without Subscription**:
   - Should be able to view sample articles
   - Should see gated preview for premium articles

3. **Authenticated User With Subscription**:
   - Should be able to view sample articles
   - Should be able to view all premium articles

## Troubleshooting

Common issues and solutions:

1. **403 Forbidden Errors**:
   - Check Strapi API token permissions
   - Verify subscription status in Supabase

2. **Authentication Issues**:
   - Ensure JWT token is being properly passed
   - Check token expiration

3. **Missing Content**:
   - Verify Strapi is properly configured
   - Check article publication status

## Future Enhancements

Potential improvements to consider:

1. **Caching Layer**:
   - Implement Redis caching for frequently accessed articles
   - Add cache invalidation on content updates

2. **Content Preview API**:
   - Create a limited content preview endpoint for non-subscribers
   - Standardize preview content format

3. **Analytics Integration**:
   - Track article views and subscription conversions
   - Measure content performance

## Conclusion

This server-side access control approach provides a secure and maintainable solution for our content gating needs. By centralizing access control logic in the backend, we've eliminated client-side security vulnerabilities while maintaining a clean separation of concerns between our content management, authentication, and presentation layers.