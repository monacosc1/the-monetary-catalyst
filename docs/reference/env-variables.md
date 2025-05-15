<!-- docs/reference/env-variables.md -->

# Reference – Environment Variables

| Key | Example | Scope | Secret? | Description |
| --- | ------- | ----- | ------- | ----------- |
| **Backend** | | | | |
| `PORT` | `4000` | backend | No | Express listen port |
| `NODE_ENV` | `production` | backend | No | Node environment |
| `SUPABASE_URL` | `https://xyz.supabase.co` | backend, frontend | No | REST endpoint |
| `SUPABASE_API_KEY` | `eyJhbGciOi...` | backend | **Yes** | Service API key (not anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | backend | **Yes** | Full-access key |
| `SUPABASE_SMTP_KEY` | `SG.xxxx` | backend | **Yes** | SMTP key for transactional email |
| `STRIPE_SECRET_KEY` | `sk_live_...` | backend | **Yes** | Server API key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | backend | **Yes** | Verify signatures |
| `STRIPE_MONTHLY_PRICE_ID` | `price_123` | backend | No | Stripe monthly plan |
| `STRIPE_ANNUAL_PRICE_ID` | `price_456` | backend | No | Stripe annual plan |
| `STRAPI_URL` | `https://cms.themonetarycatalyst.com` | backend | No | CMS API endpoint |
| `STRAPI_API_TOKEN` | `strapi_r_...` | backend | **Yes** | Read-only API |
| `SENDGRID_CONTACT_FORM_KEY` | `SG.xxxx` | backend | **Yes** | SendGrid API key for contact form |
| `SENDGRID_IP` | `1.2.3.4` | backend | No | (Optional) IP for SendGrid feedback headers |
| `FROM_EMAIL` | `support@themonetarycatalyst.com` | backend | No | Sender/recipient for transactional email |
| `SENDGRID_CONTACT_TEMPLATE_ID` | `d-abc` | backend | No | SendGrid template for contact form |
| `EMAIL_EVENTS_PUBLIC_KEY` | `SG-pub-key` | backend | **Yes** | Verify webhooks |
| `RECAPTCHA_SECRET_KEY` | `6LcB...` | backend | **Yes** | Verify captcha |
| `CONTACT_RECIPIENT_EMAIL` | `support@...` | backend | No | Contact form recipient |
| `FRONTEND_URL` | `https://app.themonetarycatalyst.com` | backend | No | Success/cancel redirects |
| `ALLOWED_ORIGINS` | `https://app.themonetarycatalyst.com` | backend | No | CORS allowed origins (comma-separated) |
| `JWT_SECRET` | `supersecret` | backend | **Yes** | JWT signing secret |
| `SMTP_KEY` | `SG.xxxx` | backend | **Yes** | (Legacy/optional) SMTP key |
| **Frontend (Next.js)** | | | | |
| `NEXT_PUBLIC_SUPABASE_URL` | same as above | frontend | No | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | frontend | No | Limited key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | frontend | No | |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | `6LcB...` | frontend | No | |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXX` | frontend | No | Google Analytics |
| `NEXT_PUBLIC_API_URL` | `https://api.themonetarycatalyst.com` | frontend | No | Base URL for API calls |
| **CMS (Strapi)** | | | | |
| `STRAPI_ADMIN_JWT_SECRET` | `supersecret` | cms | **Yes** | Admin JWT |
| `DATABASE_URL` | `postgres://...` | cms | **Yes** | DB connection |
| `FLAG_NPS` | `true` | cms | No | Enable NPS feature |
| `FLAG_PROMOTE_EE` | `true` | cms | No | Enable promote EE feature |
| `APP_KEYS` | `key1,key2` | cms | **Yes** | Strapi app keys |
| **CI / Cron** | | | | |
| `CRON_GITHUB_TOKEN` | `ghp_...` | GitHub Actions | **Yes** | Access private repo |
| `VERCEL_PROJECT_ID` | `prj_...` | GitHub Actions | **Yes** | Trigger Vercel deploy |

> **Tip**: Keep secrets in GitHub Actions *Encrypted Secrets* and Vercel's *Environment Variables* dashboard. Never commit `.env` files.

*Updated: 2024-06-XX*
