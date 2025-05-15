<!-- docs/reference/deployment-and-ci.md -->

# Reference – Deployment & Continuous Integration

---

## 1. Overview

| Part | Platform | Flow |
| ---- | -------- | ---- |
| **Frontend** (`/frontend`) | **Vercel** | Push to `main` → Vercel detects Next.js project, builds & deploys |
| **Backend API** (`/backend`) | **Railway** (alt: Fly.io) | GitHub Workflow `backend-deploy.yml` builds Docker image & pushes; Railway auto-releases |
| **CMS** (`/cms`) | **DigitalOcean App Platform** | Dockerfile build; env vars include `STRAPI_URL` etc. |
| **Database** | Supabase Cloud | Managed Postgres with daily backups |
| **Jobs / Cron** | GitHub Actions + Vercel Cron | Weekly newsletter, DB backup verify |

> **Note:** Platforms and flows are current as of 2024. Always verify with the latest infrastructure and workflow files.

---

## 2. GitHub Actions Workflows

| File | Trigger | Steps |
| ---- | ------- | ----- |
| `.github/workflows/test.yml` | `pull_request` | Lint → Jest backend tests → Cypress smoke (preview build) |
| `.github/workflows/backend-deploy.yml` | push `backend/**` ↔ tag `backend-v*` | Docker build → Railway deploy → Health check `/health` |
| `.github/workflows/newsletter-cron.yml` | `schedule: '0 13 * * 5'` | `backend/scripts/sendWeeklyNewsletter.ts` |
| `.github/workflows/db-migrate.yml` | manual dispatch | Run Supabase CLI migrations |

> **Reminder:** Keep workflow file names and steps in sync with the actual `.github/workflows` directory.

---

## 3. Deployment Checklist

1. **Secrets set** in GitHub, Railway, Vercel, DO.  
2. **CORS origins** updated (`FRONTEND_URL`, `CMS_URL`).  
3. **Stripe webhook** URL added in dashboard → `<BACKEND_URL>/api/webhook`.  
4. **SendGrid Event Webhook** URL + public key → `<BACKEND_URL>/api/email-events`.  
5. Supabase **RPC functions & RLS** migrated (`supabase db push`).  
6. Strapi **content types** exported via `config/schemas` and deployed with the CMS container.  

---

## 4. Rollback Strategy

* **Frontend** – Vercel keeps last 10 deployments; instant rollback in UI.  
* **Backend** – Railway "Deployments" tab → click previous image → promote.  
* **CMS** – DigitalOcean App Platform retains last three; click "Rollback".  

---

## 5. Monitoring & Alerts

| Tool | What | Threshold |
| ---- | ---- | --------- |
| **Better Uptime** | Ping `/health` every 30 s | alert <60 s down |
| **Stripe Dashboard** | Webhook failures | alert email |
| **Supabase logs** | Postgres errors | daily digest |

---

*Updated: 2024-06-XX*
