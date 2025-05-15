# Data Flow Documentation

## Overview
The Monetary Catalyst implements several key data flows between its frontend, backend, and integrated services (Supabase, Stripe, SendGrid). This document details these flows and their interactions.

## Authentication Flow

### Email/Password Authentication
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Supabase Auth
    participant Backend
    participant Database

    Client->>Frontend: Submit login credentials
    Frontend->>Supabase Auth: Authenticate user
    Supabase Auth-->>Frontend: Return JWT token
    Frontend->>Backend: Request with JWT
    Backend->>Supabase Auth: Verify token
    Backend->>Database: Fetch user profile
    Database-->>Backend: Return profile data
    Backend-->>Frontend: Return authenticated session
    Frontend->>Client: Update UI state
```

### Google OAuth Flow
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Google
    participant Supabase Auth
    participant Backend

    Client->>Frontend: Click Google login
    Frontend->>Google: Redirect to OAuth
    Google-->>Frontend: Return OAuth code
    Frontend->>Supabase Auth: Exchange code
    Supabase Auth-->>Frontend: Return session
    Frontend->>Backend: Create/update profile
    Backend-->>Frontend: Confirm profile
    Frontend->>Client: Redirect to dashboard
```

## Subscription Flow

### Payment Processing
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant Stripe
    participant Database
    participant SendGrid

    Client->>Frontend: Select subscription
    Frontend->>Backend: POST /api/create-checkout-session
    Backend->>Stripe: checkout.sessions.create
    Stripe-->>Backend: session.url
    Backend-->>Frontend: 200 { url }
    Frontend->>Stripe: Redirect to checkout
    Stripe-->>Backend: Webhook (checkout.session.completed)
    Backend->>Database: INSERT subscription + payment
    Backend->>SendGrid: Send confirmation email
    Frontend->>Backend: GET /api/verify-session?session_id=...
    Backend-->>Frontend: 200 { success:true }
```

### Subscription Management
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant Stripe
    participant Database

    Client->>Frontend: Manage subscription
    Frontend->>Backend: Fetch subscription
    Backend->>Database: Query status
    Database-->>Frontend: Return details
    Client->>Frontend: Update subscription
    Frontend->>Backend: Process change
    Backend->>Stripe: Update subscription
    Stripe-->>Backend: Confirm change
    Backend->>Database: Update records
```

## Content Access Flow

### Premium Content Access
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant Database
    participant CMS

    Client->>Frontend: Request article
    Frontend->>Backend: Verify access
    Backend->>Database: Check subscription
    Database-->>Backend: Return status
    Backend->>CMS: Fetch content
    CMS-->>Backend: Return article
    Backend-->>Frontend: Serve content
    Frontend->>Client: Display article
```

### Content Gating
```typescript
interface ContentGateFlow {
  checkAccess: {
    input: {
      userId: string;
      contentId: string;
    };
    output: {
      hasAccess: boolean;
      subscriptionStatus: 'active' | 'inactive';
    };
  };
  serveContent: {
    input: {
      contentId: string;
      accessLevel: 'free' | 'premium';
    };
    output: {
      content: ArticleContent;
      metadata: ContentMetadata;
    };
  };
}
```

## Newsletter Flow

### Subscription Process
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant Database
    participant SendGrid

    Client->>Frontend: Submit email
    Frontend->>Backend: POST /api/newsletter/subscribe
    Backend->>Database: upsert newsletter_users
    Database-->>Backend: row ok
    Backend->>SendGrid: Add to list + send welcome
    SendGrid-->>Backend: 202
    Backend-->>Frontend: 200 success
```

## Data Synchronization

### Database Updates
```typescript
interface DatabaseSync {
  tables: {
    user_profiles: {
      triggers: ['INSERT', 'UPDATE', 'DELETE'];
      realtime: boolean;
    };
    subscriptions: {
      triggers: ['UPDATE'];
      realtime: true;
    };
    newsletter_users: {
      triggers: ['INSERT', 'UPDATE'];
      realtime: false;
    };
  };
}
```

### Real-time Updates. Planned, not yet enabled in Production
```typescript
interface RealtimeFlow {
  subscriptionStatus: {
    channel: 'subscription_updates';
    events: ['status_change', 'payment_update'];
  };
  userProfile: {
    channel: 'profile_updates';
    events: ['profile_change', 'preferences_update'];
  };
}
```

## Error Handling Flow

### API Error Flow
```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant Backend
    participant ErrorTracking

    Client->>Frontend: Action
    Frontend->>Backend: API request
    Backend->>ErrorTracking: Log error
    Backend-->>Frontend: Error response
    Frontend->>Client: Show error UI
```

### Error Recovery
```typescript
interface ErrorRecovery {
  retryStrategy: {
    maxAttempts: number;
    backoffMs: number;
    exponential: boolean;
  };
  fallbackBehavior: {
    cacheData: boolean;
    offlineMode: boolean;
    gracefulDegradation: boolean;
  };
}
```

## Caching Strategy

### Data Caching
```typescript
interface CacheFlow {
  levels: {
    browser: {
      storage: ['localStorage', 'sessionStorage'];
      duration: number;
    };
    cdn: {
      rules: CacheRules;
      invalidation: string[];
    };
    server: {
      type: 'memory' | 'redis';
      ttl: number;
    };
  };
}
```

### Cache Invalidation
```mermaid
sequenceDiagram
    participant Frontend
    participant Backend
    participant Cache
    participant Database

    Backend->>Database: Data update
    Database-->>Backend: Confirm
    Backend->>Cache: Invalidate
    Cache-->>Backend: Clear
    Backend->>Frontend: Notify change
```
