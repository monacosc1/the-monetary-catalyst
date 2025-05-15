# Local Development Setup

## Prerequisites

### Required Software
- Node.js (v18.x or higher)
- npm (v9.x or higher)
- Git
- Docker (optional, for local database)

### Environment Setup
1. Clone the repository
```bash
git clone https://github.com/your-org/monetary-catalyst.git
cd monetary-catalyst
```

2. Install dependencies for both frontend and backend
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd ../backend
npm install
```

## Environment Variables

### Frontend Configuration
Create a `.env.local` file in the `frontend` directory:
```env
# Base URLs
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PRICE_ID_MONTHLY=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL=price_xxx

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

### Backend Configuration
Create a `.env` file in the `backend` directory:
```env
# Server
PORT=5000
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_API_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@themonetarycatalyst.com

# Security
CORS_ORIGIN=http://localhost:3000
```

## Running the Application

### Development Mode

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

3. Access the application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Running Tests
```bash
# Frontend tests
cd frontend
npm run test

# Backend tests
cd backend
npm run test
```

## Local Services Setup

### Stripe Webhook
Use Stripe CLI for local webhook testing:
```bash
# Install Stripe CLI (macOS)
brew install stripe/stripe-cli/stripe

# Login to Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhook
```

### Database Access
```bash
# Connect to Supabase Studio
npx supabase login
npx supabase link --project-ref your_project_ref
```

## Common Development Tasks

### Database Migrations
```bash
# Generate migration
npm run migration:generate name_of_migration

# Run migrations
npm run migration:run
```

### API Testing
```bash
# Using curl
curl http://localhost:5000/api/health

# Using Postman
Import the provided Postman collection from /docs/postman
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :5000

# Kill process using port
kill -9 <PID>
```

2. **Environment Variables**
```bash
# Verify environment variables are loaded
cd frontend
npm run env:check

cd backend
npm run env:check
```

3. **Dependencies Issues**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Development Tools

#### VS Code Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- REST Client

#### Recommended Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Git Workflow

### Branch Naming
```bash
feature/description
bugfix/description
hotfix/description
```

### Commit Messages
```bash
# Format
<type>(<scope>): <description>

# Examples
feat(auth): add Google OAuth integration
fix(payment): handle Stripe webhook timeout
```

## Local Performance Testing

### Frontend
```bash
# Run Lighthouse
npm run lighthouse

# Analyze bundle
npm run analyze
```

### Backend
```bash
# Run load tests
npm run test:load

# Profile API endpoints
npm run profile
```
