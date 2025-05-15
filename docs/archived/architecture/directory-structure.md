monetary-catalyst/
├── frontend/                   # Next.js 14 frontend application
│   ├── app/                   # Next.js app directory
│   │   ├── fonts/            # Custom fonts
│   │   ├── checkout/         # Checkout pages
│   │   ├── support/          # Support pages
│   │   ├── about/            # About pages
│   │   ├── auth/            # Auth-related routes
│   │   │   └── callback/    # OAuth callbacks
│   │   ├── contact/         # Contact form
│   │   ├── forgot-password/ # Password reset
│   │   ├── login/          # Login page
│   │   ├── my-account/     # Account management
│   │   ├── pricing/        # Subscription plans
│   │   ├── privacy/        # Privacy policy
│   │   ├── register/       # Registration
│   │   ├── research/       # Research content
│   │   │   ├── investment-ideas/
│   │   │   └── market-analysis/
│   │   ├── layout.tsx      # Root layout
│   │   ├── loading.tsx     # Loading states
│   │   ├── error.tsx       # Error handling
│   │   └── page.tsx        # Home page
│   ├── components/          # React components
│   │   ├── AdminPanel/
│   │   ├── ArticleGate/
│   │   ├── ArticleImage/
│   │   ├── DotPattern/
│   │   ├── ErrorBoundary/
│   │   ├── Footer/
│   │   ├── Header/
│   │   ├── NewsletterForm/
│   │   ├── PaymentDetails/
│   │   ├── SearchBar/
│   │   └── SubscriptionDetails/
│   ├── context/             # React contexts
│   │   └── AuthContext/
│   ├── services/            # API services
│   │   ├── articleService.ts
│   │   ├── emailService.ts
│   │   └── paymentService.ts
│   ├── styles/              # Global styles
│   │   └── globals.css
│   ├── types/              # TypeScript types
│   │   ├── api.ts
│   │   ├── article.ts
│   │   └── auth.ts
│   ├── utils/              # Utility functions
│   │   ├── dateFormatters.ts
│   │   ├── supabase.ts
│   │   └── withAuth.ts
│   ├── .env.local          # Local environment variables
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
│
├── backend/                # Express.js backend
│   ├── src/
│   │   ├── config/        # Configuration
│   │   │   ├── dbConfig.ts
│   │   │   ├── environment.ts
│   │   │   └── supabase.ts
│   │   ├── controllers/   # Request handlers
│   │   │   ├── authController.ts
│   │   │   ├── contentController.ts
│   │   │   ├── newsletterController.ts
│   │   │   ├── paymentController.ts
│   │   │   ├── subscriptionController.ts
│   │   │   └── webhookController.ts
│   │   ├── middleware/    # Express middleware
│   │   │   ├── authMiddleware.ts
│   │   │   └── sendgridWebhookVerification.ts
│   │   ├── models/        # Data models
│   │   │   ├── articleModel.ts
│   │   │   ├── paymentModel.ts
│   │   │   ├── subscriptionModel.ts
│   │   │   └── userModel.ts
│   │   ├── routes/        # API routes
│   │   │   ├── authRoutes.ts
|   |   |   |── contentRoutes.ts
│   │   │   ├── contactRoutes.ts
│   │   │   ├── contentRoutes.ts
│   │   │   ├── emailWebhookRoutes.ts
│   │   │   ├── newsletterRoutes.ts
│   │   │   ├── paymentRoutes.ts
│   │   │   └── webhookRoutes.ts
│   │   ├── services/      # Business logic
│   │   │   ├── emailService.ts
│   │   │   ├── jwtService.ts
│   │   │   ├── paymentService.ts
│   │   │   └── stripeService.ts
│   │   ├── tests/         # Test files
│   │   │   ├── config/
│   │   │   ├── fixtures/
│   │   │   ├── helpers/
│   │   │   ├── integration/
│   │   │   └── unit/
│   │   ├── types/         # TypeScript types
│   │   │   ├── auth.ts
│   │   │   ├── express.d.ts
│   │   │   ├── newsletter.ts
│   │   │   ├── payment.ts
│   │   │   └── subscription.ts
│   │   └── index.ts       # Entry point
│   ├── .env               # Environment variables
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── .gitignore
│
├── cms/                   # Strapi CMS
│   ├── config/           # CMS configuration
│   │   ├── admin.ts
│   │   ├── api.ts
│   │   ├── database.ts
│   │   ├── middlewares.ts
│   │   ├── plugins.ts
│   │   └── server.ts
│   ├── database/
│   │   └── migrations/
│   ├── src/
│   │   ├── admin/        # Admin customization
│   │   │   ├── app.js
│   │   │   └── tsconfig.json
│   │   ├── api/         # Content types
│   │   └── extensions/  # API extensions
│   ├── public/          # Public assets
│   │   └── uploads/
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
│
├── docs/                 # Documentation
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── data-flow.md
│   │   └── security.md
│   ├── backend/
│   │   ├── structure.md
│   │   ├── api.md
│   │   └── models.md
│   ├── frontend/
│   │   ├── structure.md
│   │   ├── components.md
│   │   └── state.md
│   ├── cms/
│   │   └── structure.md
│   ├── deployment/
│   │   ├── local.md
│   │   └── production.md
│   ├── tests/
│   │   ├── unit_tests.md
│   │   └── integration_tests.md
│   └── integrations/
│       ├── stripe.md
│       ├── supabase.md
│       └── sendgrid.md
│
├── .gitignore           # Root gitignore
├── README.md           # Project documentation
└── package.json        # Root package.json