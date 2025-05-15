<!-- docs/features/content-access.md -->

# Feature Guide – Content Access & Gating

**Feature owner:** `@content-platform`  
**Last major update:** 2024-03-19  
**Related tickets:** #74 "free samples", #119 "gated images"

---

## 1. What the feature does

* Publishes articles from **Strapi CMS**.  
* Serves public *sample* posts to anyone and full *premium* posts only to **active subscribers**.  
* Guarantees premium content can never be fetched directly from Strapi or the browser.
* Handles image URL transformation for both feature images and article gallery images.

---

## 2. High‑level sequence

```mermaid
sequenceDiagram
    autonumber
    Client->>+Next.js Frontend: GET /research/market-analysis/[slug]
    Frontend->>+Backend (Express): GET /api/content/articles/[slug] (with JWT)
    Backend->>+Strapi CMS: GET /api/articles?filters[slug]=...&populate=*
    Strapi-->>-Backend: Article JSON
    Backend->>+Supabase: Check subscription status
    Supabase-->>-Backend: Subscription data
    alt Article.isSample OR User has active subscription
        Backend-->>-Frontend: 200 OK, full article JSON
    else Forbidden
        Backend-->>-Frontend: 403 Forbidden, preview JSON
    end
    Frontend-->>-Client: Render page (full or gated with CTA)
```

Diagram source: [`diagrams/content-access-seq.mmd`](../diagrams/content-access-seq.mmd)

---

## 3. Data model highlights

| System | Entity | Key fields used here | Notes |
| ------ | ------ | ------------------- | ----- |
| **Strapi** | `Article` | `id`, `title`, `slug`, `content`, `isSample:boolean`, `article_type:enum`, `feature_image_url`, `article_images[*]` | `isSample = true` → always public |
| **Supabase** | `subscriptions` | `user_id`, `status`, `current_period_end` | `status='active'` grants premium access |

*Full schemas:* see [`../reference/data-models.md`](../reference/data-models.md).

---

## 4. Key code touch‑points

| Layer | File @ line | Reason |
| ----- | ----------- | ------ |
| Backend route | `backend/src/routes/contentRoutes.ts:48-197` | Handles article requests, subscription checks, and image URL transformation |
| Auth check | `backend/src/middleware/authMiddleware.ts:15-40` | Validates Supabase JWT and attaches `req.user` |
| Frontend pages | `frontend/app/research/market-analysis/[slug]/page.tsx` | Market analysis article page with gating |
|  | `frontend/app/research/investment-ideas/[slug]/page.tsx` | Investment ideas article page with gating |
| Frontend service | `frontend/services/articleService.ts:154-208` | Handles API calls and error processing |
| Gate component | `frontend/components/ArticleGate.tsx` | Displays CTA + login or subscribe buttons |
| Sample display | `frontend/components/SampleArticleDisplay.tsx` | Renders sample articles with banner |

---

## 5. Environment variables

| Name | Example | Used in |
| ---- | ------- | ------- |
| `STRAPI_URL` | `https://cms.themonetarycatalyst.com` | Backend content routes |
| `STRAPI_API_TOKEN` | `strapi_r_1234abcd...` | Backend only (bearer header) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Frontend API calls |

---

## 6. Error & edge‑case behaviour

| Scenario | HTTP code | Frontend behaviour |
| -------- | -------- | ------------------ |
| Slug not found in Strapi | 404 | Next.js `notFound()` page |
| Not subscribed to premium | 403 + preview JSON | Renders `ArticleGate` with teaser |
| Subscription expired mid‑session | 403 + preview on refresh | User sees gated view on refresh |
| Strapi unreachable | 502 | Generic error toast + retry option |
| Invalid image URLs | 200 (with transformed URLs) | Backend transforms relative URLs to absolute |
| Auth token missing | 401 | Redirect to login page |
| Auth token invalid | 401 | Redirect to login page |

---

## 7. Open TODOs / Future work

* **Batch fetch** related articles to reduce per‑page latency (#201).  
* Switch to **GraphQL** Strapi endpoint once rate‑limited REST issues resolved.  
* Memoize `isUserSubscribed` in Redis to cut Supabase calls by ~60 ms.  
* Add image optimization and caching layer.
* Implement article preview generation for SEO.

---

## 8. Changelog excerpts

* **2024-03-19** – Added image URL transformation for gallery images.
* **2024-03-18** – Moved subscription check to backend.
* **2024-03-17** – Implemented sample article display component.
* **2024-03-16** – Set up content gating with Strapi.
