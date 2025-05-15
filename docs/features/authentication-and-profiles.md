<!-- docs/features/authentication-and-profiles.md -->

# Feature Guide – Authentication & Profiles

**Feature owner:** `@auth`  
**Last major update:** 2024-03-19  
**Related tickets:** #12 "Google OAuth callback", #101 "terms checkbox enforcement"

---

## 1. What the feature does

* Provides **email + password** and **Google OAuth** sign-in via **Supabase Auth**.  
* Issues a **JWT** the frontend stores via Supabase client-side storage.  
* Creates / updates a **user_profiles** row on first successful sign-in.  
* Backend routes validate the JWT with **authMiddleware** and attach `req.user`.  
* Optional checkbox forces users to acknowledge **Terms & Conditions** before account creation.
* Integrates with newsletter subscription system, linking existing subscribers during registration.

---

## 2. End-to-end sequence

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Frontend
    participant SupabaseAuth
    participant Backend
    participant SupabaseDB

    Note over Client,Frontend: **Email + Password flow**
    Client->>+Frontend: Fill form & click "Create account"
    Frontend->>+Backend: POST /api/auth/register { email, password, first_name, last_name, termsAccepted }
    Backend->>+SupabaseAuth: createUser({ email, password })
    SupabaseAuth-->>-Backend: { user, session }
    Backend->>+SupabaseDB: Check newsletter subscription
    SupabaseDB-->>-Backend: subscription status
    Backend->>+SupabaseDB: INSERT INTO user_profiles …
    SupabaseDB-->>-Backend: row ok
    Backend->>+EmailService: sendWelcomeEmail()
    Backend-->>-Frontend: 201 { profile }
    Frontend->>+SupabaseAuth: signInWithPassword({ email, password })
    SupabaseAuth-->>-Frontend: { user, session(JWT) }
    Frontend-->>Client: Redirect to /pricing

    == Google OAuth variant ==
    Client->>+Frontend: Click "Sign in with Google"
    Frontend->>+SupabaseAuth: signInWithOAuth({ provider: 'google' })
    SupabaseAuth-->>Client: Redirect to Google
    Client->>+SupabaseAuth: OAuth callback
    SupabaseAuth-->>Client: Redirect back with access_token
    Client->>+Frontend: /auth/callback
    Frontend->>+Backend: POST /api/auth/google-callback { user_id, email, first_name, last_name, google_id }
    Backend->>+SupabaseDB: UPSERT user_profiles …
    Backend->>+EmailService: sendWelcomeEmail()
    Backend-->>-Frontend: 200 { profile }
```

Diagram source: [`../diagrams/auth-flow-seq.mmd`](../diagrams/auth-flow-seq.mmd)

---

## 3. Data model highlights

| System | Entity | Key fields | Notes |
| ------ | ------ | ---------- | ----- |
| **Supabase** | `auth.users` | `id`, `email`, `provider`, `created_at` | Canonical auth table managed by Supabase |
|  | `user_profiles` | `user_id (PK/FK)`, `email`, `first_name`, `last_name`, `role`, `terms_accepted`, `newsletter_subscribed`, `stripe_customer_id`, `google_id` | One-to-one extension of `auth.users` |
|  | `newsletter_users` | `id`, `email`, `user_id`, `status`, `subscribed_at` | Tracks newsletter subscriptions |

See full schema: [`../reference/data-models.md`](../reference/data-models.md)

---

## 4. Key code touch-points

| Layer | File | Purpose |
| ----- | ----------- | ------- |
| **Frontend pages** | `frontend/app/register/page.tsx` | Registration form with email/password and Google OAuth |
|  | `frontend/app/login/page.tsx` | Login form with email/password and Google OAuth |
|  | `frontend/app/my-account/page.tsx` | User profile management |
| **Frontend context** | `frontend/context/AuthContext.tsx` | Global auth state and methods (login, register, logout, Google OAuth) |
| **Frontend utils** | `frontend/utils/withAuth.tsx` | HOC for protecting routes |
| **Backend routes** | `backend/src/routes/authRoutes.ts` | `/register`, `/login`, `/google-callback`, `/profile` |
| **Backend controllers** | `backend/src/controllers/authController.ts` | User registration, login, profile management |
| **Backend middleware** | `backend/src/middleware/authMiddleware.ts` | JWT verification and user injection |

---

## 5. Environment variables

| Name | Example | Used in |
| ---- | ------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzcompany.supabase.co` | Frontend |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Frontend |
| `SUPABASE_URL` | `https://xyzcompany.supabase.co` | Backend |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Backend (server-side) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Frontend API calls |

---

## 6. Error & edge-case behaviour

| Scenario | API response | Frontend handling |
| -------- | ------------ | ----------------- |
| Email already registered | 400 `{ message: "User already exists" }` | Show inline message with login link |
| Invalid email format | 400 `{ error: "Please provide a valid email address" }` | Show inline validation error |
| Wrong password | 401 `{ message: "Invalid credentials" }` | Show inline error message |
| Terms unchecked | 400 `{ message: "You must accept the Terms & Conditions" }` | Disable submit button + client validation |
| JWT expired | 401 on any protected route | Redirect to login page |
| Profile creation failed | 500 `{ message: "Error creating user profile" }` | Show error message, rollback auth user |
| Newsletter link failed | 200 (non-blocking) | Log error but complete registration |
| Google OAuth error | 500 `{ error: "Failed to process Google callback" }` | Show error message, allow retry |

---

## 7. Open TODOs / Future work

* Add **email verification** flow with confirmation emails.  
* Implement **password reset** functionality.  
* Add **role-based access control** using the `role` column.  
* Support **magic-link login** (passwordless).  
* Improve error handling for newsletter subscription linking.
* Add rate limiting for registration attempts.

---

## 8. Changelog excerpts

* **2024-03-19** – Initial feature documentation created.
* **2024-03-18** – Added Google OAuth integration.
* **2024-03-17** – Implemented Terms & Conditions enforcement.
* **2024-03-16** – Set up Supabase Auth with email/password.
