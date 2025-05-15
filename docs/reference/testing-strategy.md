<!-- docs/reference/testing-strategy.md -->

# Reference – Testing Strategy

---

## 1. Layers & Tools

| Layer | Tooling | Folder |
| ----- | ------- | ------ |
| **Backend unit** | Jest + ts-jest | `backend/src/tests/` |
| **Backend integration** | Supertest (API) | `backend/src/tests/` |
| **Frontend unit** | React Testing Library + Jest | `frontend/__tests__/` |
| **End-to-end (E2E)** | Cypress Cloud | `cypress/` |
| **Static checks** | ESLint, Prettier, TypeScript, Markdown-lint | root + docs |

---

## 2. Test Matrix

| Scenario | Layer | CI job |
| -------- | ----- | ------ |
| Controllers return expected status & body | Backend unit | `npm run test:unit` |
| Auth middleware rejects bad JWT | Backend integration | `npm run test:int` |
| Pricing page renders plan prices | Frontend unit | `npm run test:unit` |
| Checkout → Stripe sandbox → success page | Cypress E2E | `yarn cypress run --record` |
| Docs links valid (markdown-lint) | Static | `npm run lint:md` |

---

## 3. Test Data

* **Supabase** – CI pipeline spins up ephemeral branch DB via `supabase db reset --config testing.toml`.  
* Stripe keys set to **test mode** (`STRIPE_SECRET_KEY=sk_test_...`).  
* **Email** – SendGrid sandbox mode; API returns 200 without sending.  
* Strapi CMS mocked via msw (`msw/handlers/strapi.ts`) for frontend unit tests.

---

## 4. Coverage Targets

| Layer | Threshold |
| ----- | --------- |
| Backend controllers | **80 % lines** |
| Backend services | **90 % lines** |
| Frontend React components | **70 % lines** |
| Critical utils (auth, payments) | **95 % lines** |

Failing to meet thresholds blocks merge in `test.yml`.

---

## 5. Running tests locally

```bash
# backend
cd backend
pnpm install
pnpm test:unit
pnpm test:int

# frontend
cd ../frontend
npm i
npm run test

# e2e (needs local servers running)
npm run dev &  # frontend
pnpm --filter backend dev &   # backend API
npx cypress open
```

---

## 6. Future Enhancements

* Snapshot tests for **ArticleGate** component.  
* Contract tests between backend & Strapi using OpenAPI schemas.  
* Visual regression (Percy) for marketing pages.

---

*Updated: 2024-06-XX*
