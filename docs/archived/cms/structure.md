# CMS Architecture Documentation

## Overview
The Monetary Catalyst uses Strapi as its headless CMS for managing article content and media assets. The CMS is configured with TypeScript and integrates with Supabase for media storage.

## Directory Structure
```
cms/
├── config/                     # Configuration files
│   ├── admin.ts               # Admin panel configuration
│   ├── api.ts                 # API settings
│   ├── database.ts            # Database connection
│   ├── middlewares.ts         # Middleware setup
│   ├── plugins.ts             # Plugin configuration
│   └── server.ts              # Server settings
│
├── database/
│   └── migrations/            # Database migrations
│
├── src/
│   ├── admin/                 # Admin customization
│   │   └── app.js            # Admin panel configuration
│   │
│   ├── api/                   # Content types and routes
│   └── extensions/            # API extensions
│
└── public/                    # Public assets
    └── uploads/               # Local media storage
```

## Configuration

### Environment Variables
```env
# Server Configuration
HOST=0.0.0.0
PORT=1337

# Security Keys
APP_KEYS=your_app_keys_here
API_TOKEN_SALT=your_api_token_salt_here
ADMIN_JWT_SECRET=your_admin_jwt_secret_here
TRANSFER_TOKEN_SALT=your_transfer_token_salt_here
JWT_SECRET=your_jwt_secret_here

# Database Configuration
DATABASE_CLIENT=postgres
DATABASE_URL=your_database_url_here

# Media Storage (Supabase)
SUPABASE_URL=your_supabase_url_here
SUPABASE_API_KEY=your_supabase_api_key_here
SUPABASE_BUCKET=articles
```

## Media Management

### Supabase Integration
```javascript
// config/plugins.js
module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-provider-upload-supabase',
      providerOptions: {
        apiUrl: env('SUPABASE_URL'),
        apiKey: env('SUPABASE_API_KEY'),
        bucket: env('SUPABASE_BUCKET'),
        directory: 'articles',
        options: {
          uploadPath: 'articles'
        }
      },
    },
  },
});
```

## Content Types

### Article Schema
```typescript
interface ArticleSchema {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: Relation;
  category: Enumeration;
  status: Enumeration;
  feature_image: Media;
  publish_date: DateTime;
}
```

## API Configuration

### REST API Settings
```typescript
// config/api.ts
export default {
  rest: {
    defaultLimit: 25,
    maxLimit: 100,
    withCount: true,
  },
};
```

### CORS Configuration
```javascript
// config/middlewares.js
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['http://localhost:3000'],
      headers: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    },
  },
  // ... other middlewares
];
```

## Database Configuration

### PostgreSQL Setup
```typescript
// config/database.ts
export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      connectionString: env('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: false
      },
    },
    pool: {
      min: 0,
      max: 5,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
  },
});
```

## Admin Panel Customization

### Editor Configuration
```javascript
// src/admin/app.js
export default {
  config: {
    editor: {
      enabled: true,
      config: {
        toolbar: {
          items: [
            'heading',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'code',
            'link',
            'bulletedList',
            'numberedList',
            'media',
            'blockquote',
            'undo',
            'redo'
          ],
        },
      },
    },
  },
  bootstrap() {},
};
```

## Security

### Authentication
- Admin panel JWT authentication
- API token authentication
- Role-based access control

### API Security
- Rate limiting
- CORS configuration
- SSL/TLS encryption
- Input validation

## Development Workflow

### Local Development
```bash
# Start development server
npm run develop

# Build admin panel
npm run build

# Start production server
npm run start
```

### Deployment
```bash
# Build for production
npm run build

# Deploy using Strapi CLI
npm run deploy
```

## Integration with Frontend

### Content Fetching
```typescript
// Example of content fetching from frontend
async function fetchArticle(slug: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/articles?filters[slug]=${slug}`
  );
  return response.json();
}
```

## Performance Considerations

### Caching Strategy
- Response caching
- Media asset caching
- Database query optimization

### Resource Management
- Connection pooling
- Media upload limits
- API rate limiting
