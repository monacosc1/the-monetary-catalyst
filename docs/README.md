<!-- docs/README.md -->

# Documentation Hub for *The Monetary Catalyst*

> **Goal:** Give any human developer *or* LLM everything needed to understand, maintain, and extend the project with perfect accuracy.

---

## 📚 How this directory is organized

| Folder | Purpose | Typical reader questions answered |
| ------ | ------- | --------------------------------- |
| **features/** | End-to-end guides for each major user-facing capability.  Each doc links to relevant code, data models, API routes, and external services. | “How does content gating work from Strapi → backend → Next.js?” |
| **reference/** | Stable look-ups (API reference, data model glossary, env-vars, deployment notes, troubleshooting).  Facts, not narrative. | “What does `/api/create-checkout-session` expect?”<br>“What fields exist in `subscriptions`?” |
| **diagrams/** | All Mermaid sequence / flow / ER diagrams lives here (so they render on GitHub). Feature docs embed them via `![diagram](../diagrams/…)`. | Keeps diagrams version-controlled and reusable. |
| **changelog/** | Short, dated Markdown notes for significant architectural changes. | “Why was Stripe webhook logic moved in v0.9.0?” |

> **Tip:**<br>Feature docs are intentionally **cross-layer**; reference docs stay **layer-specific**. Together they eliminate duplication while giving both narrative flow *and* exact look-ups.

---

## Quick links

* **Feature Guides**: [`features/`](./features)  
  * Content Access & Gating  
  * Subscriptions & Payments  
  * Authentication & Profiles  
  * Newsletter & Email  
  * Contact Form with reCAPTCHA  
* **Reference**: [`reference/`](./reference)  
  * API Endpoints  
  * Data Models (Supabase & Strapi)  
  * Env Variables  
  * Deployment & CI  
  * Testing Strategy  

---

## Contributing to docs

1. **Choose the right home** – narrative in *features/*, factual tables in *reference/*.  
2. **Reference code** with absolute paths (`backend/src/routes/contentRoutes.ts:42`) so IDEs/LLMs can jump.  
3. **Update diagrams** in `diagrams/` and embed with a relative link.  
4. **Run `npm run docs:lint`** (markdown-lint) before committing.

Happy documenting! ✍️
