# Frontend Architecture Documentation

## Overview
The frontend of The Monetary Catalyst is built with Next.js 14 using the App Router pattern, TypeScript for type safety, and Tailwind CSS for styling. The application follows a component-based architecture with clear separation of concerns.

## Directory Structure
frontend/
├── app/ # Next.js 14 app directory
│ ├── fonts/ # Custom font files
│ │   ├── GeistVF.woff # Variable font
│ │   └── GeistMonoVF.woff # Monospace variable font
│ ├── checkout/ # Checkout page
│ ├── support/ # Support page
│ ├── about/ # About page
│ ├── auth/ # Auth-related routes
│ │   └── callback/ # OAuth callback handling
│ ├── contact/ # Contact form page
│ ├── forgot-password/ # Password reset
│ ├── login/ # Login page
│ ├── my-account/ # User account management
│ ├── pricing/ # Subscription plans
│ ├── privacy/ # Privacy policy
│ ├── register/ # User registration
│ ├── research/ # Research content pages
│ │   ├── investment-ideas/ # Investment content
│ │   │   ├── [slug]/ # Dynamic article routes
│ │   │   └── page/ # Pagination
│ │   └── market-analysis/ # Market analysis content
│ │       ├── [slug]/ # Dynamic article routes
│ │       └── page/ # Pagination
│ ├── layout.tsx # Root layout
│ ├── loading.tsx # Loading states
│ ├── error.tsx # Error handling
│ └── page.tsx # Home page
├── components/ # Reusable React components
│ ├── AdminPanel/ # Admin interface
│ ├── ArticleGate/ # Premium content gate
│ ├── ArticleImage/ # Image handling
│ ├── DotPattern/ # UI pattern component
│ ├── ErrorBoundary/ # Error handling
│ ├── Footer/ # Site footer
│ ├── Header/ # Site header
│ ├── NewsletterForm/ # Newsletter signup
│ ├── PaymentDetails/ # Payment management
│ ├── SearchBar/ # Article search
│ └── SubscriptionDetails/ # Subscription management
├── context/ # React context providers
│ └── AuthContext/ # Authentication context
├── services/ # API service integrations
│ ├── articleService.ts # Content management
│ ├── emailService.ts # Email functionality
│ └── paymentService.ts # Payment processing
├── styles/ # Global styles
│ └── globals.css # Global CSS
├── types/ # TypeScript type definitions
│ ├── api.ts # API types
│ ├── article.ts # Content types
│ └── auth.ts # Authentication types
└── utils/ # Utility functions
│   ├── dateFormatters.ts # Date formatting
│   ├── supabase.ts # Supabase client
│   └── withAuth.ts # Auth HOC
├── README.md # Frontend documentation
└── .gitignore # Git ignore rules

## Key Architectural Patterns

### Page Organization
- **App Router**: Uses Next.js 14 App Router for file-system based routing
- **Layout Pattern**: Shared layouts for consistent UI across pages
- **Client/Server Components**: Strategic use of 'use client' directive
- **Dynamic Routes**: Implemented for article pages and pagination

### State Management
- **Auth Context**: Global authentication state management
- **React Hooks**: Local state management
- **Supabase Client**: Database and auth state synchronization

### Data Fetching
- **API Services**: Centralized API calls in /services directory
- **Server-Side Fetching**: Where possible for SEO
- **Client-Side Fetching**: For dynamic data needs

### Component Architecture
- **Atomic Design**: Components organized by complexity
- **Composition**: Component composition over inheritance
- **Props Interface**: Strong TypeScript typing for props

### Authentication Flow
1. User authentication via Supabase Auth
2. Google OAuth integration
3. Protected routes and content gating
4. Session management

### Payment Integration
1. Stripe Elements integration
2. Checkout session creation
3. Subscription management
4. Payment method updates

## Key Files and Their Roles

### Core Configuration
- `app/layout.tsx`: Root layout with providers
- `context/AuthContext.tsx`: Authentication state management
- `utils/supabase.ts`: Supabase client configuration

### Page Templates
- `app/page.tsx`: Home page
- `app/research/*`: Research content pages
- `app/my-account/*`: User account management

### Service Integration
- `services/articleService.ts`: Content fetching
- `services/paymentService.ts`: Stripe integration
- `services/emailService.ts`: Newsletter functionality

## Development Guidelines

### Component Creation
1. Use TypeScript interfaces for props
2. Implement error boundaries
3. Follow naming conventions
4. Include proper documentation

### State Management Rules
1. Use context for global state
2. Local state for component-specific data
3. Proper error and loading states

### Styling Approach
1. Tailwind CSS for styling
2. Consistent color scheme
3. Responsive design patterns
4. Dark/light theme support

### Performance Considerations
1. Image optimization
2. Component lazy loading
3. API request caching
4. Bundle size optimization

## Frontend-Backend Integration

### API Service Layer
The frontend communicates with the backend through service modules that abstract API calls:

```typescript
// services/articleService.ts
export const articleService = {
  getArticleBySlug: async (slug: string) => {
    // API call to backend
  },
  getArticlePreviews: async (page: number, limit: number) => {
    // API call to backend
  }
};
```

### Backend Service Integration

#### Content Management
- **Models**: Interfaces with `articleModel.ts` for content structure
- **Controllers**: Communicates with `contentController.ts` for article operations
- **Routes**: Utilizes `contentRoutes.ts` for content endpoints

#### Payment Processing
- **Stripe Integration**: 
  - Frontend: Stripe Elements for payment UI
  - Backend: `stripeService.ts` for payment processing
  - Webhook handling for subscription events

#### User Management
- **Authentication**: 
  - Supabase Auth for user sessions
  - Integration with `userModel.ts` for profile data
- **Subscriptions**:
  - Frontend subscription UI components
  - Backend `subscriptionModel.ts` for subscription state

### Data Flow Example
```typescript
// Frontend Component -> Backend Service -> Database
async function fetchArticle(slug: string) {
  // 1. Frontend Request
  const article = await articleService.getArticleBySlug(slug);
  
  // 2. Backend Processing (contentController.ts)
  // - Validates request
  // - Queries database via articleModel.ts
  // - Returns formatted response
  
  // 3. Frontend Display
  setArticle(article);
}
```

### API Response Types
```typescript
// Shared types between frontend and backend
interface ArticleResponse {
  id: string;
  title: string;
  content: string;
  // ... other fields
}

interface SubscriptionResponse {
  status: 'active' | 'inactive';
  plan: string;
  // ... other fields
}
```

### Error Handling
```typescript
try {
  const response = await apiService.getData();
  // Handle success
} catch (error) {
  if (error instanceof ApiError) {
    // Handle specific API errors
  } else {
    // Handle general errors
  }
}
```

## Common Patterns

### Form Handling

### Protected Routes

### API Integration

## Future Considerations
1. Migration to server components where applicable
2. Enhanced error boundary implementation
3. Improved loading states
4. Analytics integration
5. A/B testing capability


