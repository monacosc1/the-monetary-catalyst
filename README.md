# The Monetary Catalyst

## Overview
The Monetary Catalyst is a comprehensive financial research and analysis platform providing premium market insights and investment ideas. The platform offers subscription-based access to professional financial research, market analysis, and investment strategies.

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: Supabase
- **CMS**: Strapi
- **Authentication**: Supabase Auth
- **Payment Processing**: Stripe
- **Email Service**: SendGrid
- **Deployment**: Vercel (Frontend), Railway (Backend)

## Core Features
- User authentication with email and Google OAuth
- Subscription management with Stripe
- Premium content access control
- Market analysis and investment ideas publication
- Newsletter subscription system
- Contact form with reCAPTCHA protection

## Quick Start

### Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/monetary-catalyst.git
cd monetary-catalyst

# Install dependencies
cd frontend && npm install
cd ../backend && npm install
```

For detailed setup instructions, see below

## Documentation

### Architecture
- [System Overview](docs/architecture/overview.md)
- [Data Flow](docs/architecture/data-flow.md)
- [Security Architecture](docs/architecture/security.md)

### Frontend
- [Structure](docs/frontend/structure.md)
- [Components](docs/frontend/components.md)
- [State Management](docs/frontend/state.md)

### Backend
- [Structure](docs/backend/structure.md)
- [API Documentation](docs/backend/api.md)
- [Models](docs/backend/models.md)

### Strapi
- [Structure](docs/cms/structure.md)

### Integrations
- [Stripe Integration](docs/integrations/stripe.md)
- [Supabase Integration](docs/integrations/supabase.md)
- [SendGrid Integration](docs/integrations/sendgrid.md)

### Deployment
- [Local Development](docs/deployment/local.md)
- [Production Deployment](docs/deployment/production.md)

## Development Workflow

### Branch Strategy
```main           # Production branch
├── staging    # Pre-production testing
└── develop    # Development branch
    ├── feature/... # Feature branches
    └── bugfix/...  # Bug fix branches
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Jest for testing
- Husky for pre-commit hooks

### Testing
```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run E2E tests
npm run test:e2e
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Environment Setup

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Backend Environment Variables
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_service_role_key
```

For complete environment variable list, see [Environment Setup Guide](docs/deployment/local.md#environment-variables)

## Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
vercel --prod
```

### Backend Deployment
```bash
cd backend
railway up
```

For detailed deployment instructions, see [Production Deployment Guide](docs/deployment/production.md)

## Support
- [Issue Tracker](https://github.com/your-org/monetary-catalyst/issues)
- [Documentation](docs/)
- [Support Page](https://themonetarycatalyst.com/support)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments
- [Next.js](https://nextjs.org/)
- [Express.js](https://expressjs.com/)
- [Supabase](https://supabase.io/)
- [Stripe](https://stripe.com/)
- [SendGrid](https://sendgrid.com/) 