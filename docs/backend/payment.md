# Payment Integration Overview

This document provides a comprehensive summary of how payments and subscriptions work within **The Monetary Catalyst** project. It is intended for anyone new to the project who needs a quick, high-level understanding of the payment flow and Stripe integration.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Key Components](#key-components)
3. [Subscription and Payment Flow](#subscription-and-payment-flow)
4. [Recurring Payments](#recurring-payments)
5. [Payment Method Updates](#payment-method-updates)
6. [Webhook Handling](#webhook-handling)
7. [Database Schema & Relations](#database-schema--relations)
8. [Important Notes & Best Practices](#important-notes--best-practices)

---

## Architecture Overview

- **Backend**: Deployed on Vercel, using Express.js + TypeScript.  
- **Frontend**: Next.js + TypeScript, hosted on Vercel.  
- **Database**: Supabase, with tables for `user_profiles`, `subscriptions`, `payments`, and `newsletter_users`.  
- **Stripe**: Used for subscription billing and payment processing.  
- **Auth**: Supabase Auth for user login and session management.

---

## Key Components

1. **Stripe Customer**  
   - Each user has a `stripe_customer_id` stored in `user_profiles`. If it’s missing, the system creates a new Stripe customer when the user checks out.
2. **Checkout Session**  
   - Triggered when a user selects a plan (monthly or yearly) on the `/pricing` page. The server creates a Stripe Checkout Session with `mode: 'subscription'`.
3. **Subscriptions Table**  
   - Stores each user’s subscription data: `plan_type`, `status`, `stripe_subscription_id`, `start_date`, `end_date`, etc.
4. **Payments Table**  
   - Tracks all payment records, including initial and recurring payments. Each payment row references the `subscription_id` and `user_id`.

---

## Subscription and Payment Flow

### 1. User Chooses a Plan
- The user visits the `/pricing` page, selects **Monthly** or **Yearly**, and clicks **Subscribe**.
- If the user isn’t logged in, they’re redirected to register or sign in.

### 2. Create Checkout Session
- The frontend calls `POST /api/create-checkout-session` with the chosen `priceId`.
- The backend:
  - Checks for an existing `stripe_customer_id`. Creates one if needed.
  - Creates a Stripe Checkout Session with `payment_method_types = ['card']`.
  - Returns a `session.url` for the user to complete the payment on Stripe’s hosted page.

### 3. User Completes Payment
- The user enters card details on Stripe’s hosted checkout.
- On success, Stripe redirects them to `/success?session_id=...`.

### 4. Verify Session & Database Update
- The frontend calls `GET /api/verify-session?session_id=...` to confirm payment success.
- The backend calls `stripe.checkout.sessions.retrieve(session_id)`:
  - If `payment_status` is `'paid'` and `status` is `'complete'`, the subscription is considered active.
  - The user is granted premium access.

---

## Recurring Payments

1. **Stripe Invoices**  
   - Every month or year, Stripe charges the user automatically, generating an `invoice`.
2. **`invoice.payment_succeeded` Event**  
   - When the payment succeeds, Stripe sends a webhook to `POST /api/webhook`.
   - The backend inserts a **new row** in `payments` to record the recurring charge.
   - The existing subscription row is updated with `last_payment_date` (and optionally `last_payment_id`).
3. **Failed Payments**  
   - If a payment fails, Stripe retries up to three times by default.  
   - If the final attempt fails, the event `invoice.payment_failed` is triggered. The subscription may be marked inactive, prompting the user to update their payment method.

---

## Payment Method Updates

1. **Profile Dashboard**  
   - A user can view or update their card details on the profile/payment settings page.
2. **SetupIntent**  
   - The backend endpoint `POST /api/create-setup-intent` creates a SetupIntent to securely collect card info.
   - The frontend uses Stripe Elements to capture new card data and confirm the SetupIntent.
3. **Default Payment Method**  
   - The new card is attached to the Stripe customer and set as the **default** payment method for future recurring charges.

---

## Webhook Handling

1. **Webhook Endpoint**  
   - `POST /api/webhook` expects a raw request body for Stripe’s signature verification.
2. **Signature Verification**  
   - The code calls `stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)` to ensure authenticity.
3. **Key Events**  
   - **`checkout.session.completed`**: Creates a new subscription & payment record for the initial charge.  
   - **`invoice.payment_succeeded`**: Creates a new payment row for recurring charges, updates subscription status.  
   - **`invoice.payment_failed`**: Marks the subscription as inactive/failed if all retry attempts fail.  
   - **`customer.subscription.deleted`**: Marks the subscription as `expired` or `cancelled` in the database.

---

## Database Schema & Relations

1. **user_profiles**  
   - `user_id` (PK references `auth.users.id`), `stripe_customer_id`, `email`, `first_name`, `last_name`, `role`, etc.
2. **subscriptions**  
   - `id`, `user_id` (references `user_profiles.user_id`), `stripe_subscription_id`, `plan_type`, `status`, `start_date`, `end_date`, `last_payment_date`, etc.
3. **payments**  
   - `id`, `user_id` (references `user_profiles.user_id`), `subscription_id` (references `subscriptions.id`), `amount`, `stripe_payment_id`, `stripe_invoice_id`, etc.
4. **newsletter_users**  
   - Not directly related to billing, but used for newsletter subscriptions.

---

## Important Notes & Best Practices

1. **Live vs. Test Mode**  
   - Always ensure `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are set correctly in production.  
2. **Monitoring & Logging**  
   - In production, use a monitoring service (like Sentry) to track webhook errors and exceptions.  
3. **Security**  
   - Keep your Stripe secrets in environment variables, never commit them to source control.  
   - Verify webhook signatures to prevent spoofed requests.
4. **Testing**  
   - Use the Stripe CLI or test cards in development. In production, consider small real transactions for final verification.

---

**That’s it!** This document should give any new team member a **100%** view of how payments work in **The Monetary Catalyst**. For more detailed code references, see the code updates and unit tests documentation.


---
# The Monetary Catalyst - Payment Integration Summary

This document provides a comprehensive overview of how The Monetary Catalyst’s payment system interacts with Stripe, ensuring new team members quickly understand the integration at 100% depth. As of February 26, 2025, this summary covers the tech stack, flow, and key components for managing subscriptions and payments.

## Overview
The Monetary Catalyst is a subscription-based financial research platform offering premium market insights and investment ideas via monthly or yearly plans. Payments are processed using Stripe, integrated with a Next.js 14 frontend and an Express.js backend, using Supabase for database management and authentication.

## Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: Supabase (two instances: development and production)
- **Payment Processing**: Stripe
- **Deployment**: Vercel (frontend and backend)

## Payment Functionality
The system supports:
- User subscriptions (monthly or yearly) for premium content access.
- Payment method updates via Stripe Elements.
- Recurring payment handling for active subscriptions.
- Webhook-driven synchronization with Supabase for subscription and payment tracking.

## Payment Flow

### 1. User Checkout Flow
- **Trigger**: A logged-in user selects a monthly or yearly plan on the `/pricing` page.
- **Frontend Action** (`/frontend/app/pricing/page.tsx`):
  - Uses Supabase Auth to verify the user session.
  - Calls `/api/create-checkout-session` with the selected price ID (`STRIPE_MONTHLY_PRICE_ID` or `STRIPE_YEARLY_PRICE_ID`).
- **Backend Action** (`/backend/controllers/paymentController.ts`):
  - `createCheckoutSession` retrieves or creates a Stripe customer (`stripe_customer_id`) in the `user_profiles` table.
  - Creates a Stripe Checkout session with the customer, price ID, and return URLs (`/success` for success, `/pricing` for cancel).
  - Redirects the user to Stripe’s hosted checkout page.
- **User Action**: Enters card details and completes payment.
- **Outcome**: On success, redirects to `/success`; on cancel, returns to `/pricing`.

### 2. Post-Checkout Processing
- **Webhook Handling** (`/backend/controllers/paymentController.ts`):
  - Stripe sends a `checkout.session.completed` event to `https://api.themonetarycatalyst.com/api/webhook`.
  - The backend verifies the signature with `STRIPE_WEBHOOK_SECRET` and processes the event:
    - Creates a new row in the `subscriptions` table with `status: "active"`.
    - Creates a new row in the `payments` table with payment details.
    - Updates `user_profiles.stripe_customer_id` if needed.
  - Sends a confirmation email via SendGrid.
- **Frontend Verification** (`/frontend/app/success/page.tsx`):
  - Calls `/api/verify-session` to confirm the payment status.
  - Updates the UI based on success or failure, redirecting to the homepage after success.

### 3. Payment Method Updates
- **Trigger**: User navigates to their profile dashboard and clicks “Update Payment Method” in `PaymentDetails.tsx`.
- **Frontend Action**:
  - Calls `/api/create-setup-intent` to get a Stripe SetupIntent client secret.
  - Renders a `PaymentElement` using Stripe Elements for card input.
- **Backend Action** (`/backend/controllers/paymentController.ts`):
  - `createSetupIntent` generates a SetupIntent for the user’s `stripe_customer_id`.
  - On success, the new payment method is set as the default for the customer and subscriptions via webhooks (`setup_intent.succeeded`).
- **Outcome**: Updates the default payment method for future recurring payments.

### 4. Recurring Payments
- **Trigger**: Stripe processes monthly or yearly recurring payments.
- **Webhook Handling**:
  - Receives `invoice.payment_succeeded` events at `/api/webhook`.
  - Creates a new row in the `payments` table.
  - Updates the existing `subscriptions` row’s `last_payment_id` and `last_payment_date`, keeping `status: "active"`.
- **Outcome**: Ensures subscription continuity without duplicating subscription records.

## Database Structure
The Supabase database (development and production) includes:
- **user_profiles**: Stores user data, including `stripe_customer_id` for linking to Stripe customers.
- **subscriptions**: Tracks active subscriptions with fields like `stripe_subscription_id`, `status`, `last_payment_id`, and `last_payment_date`.
- **payments**: Records each payment with `stripe_payment_id`, `stripe_invoice_id`, `amount`, and `subscription_id`.
- **newsletter_users**: For newsletter subscriptions (not payment-related).

## Key Components
- **Backend Files**:
  - `services/paymentService.ts`: Manages payment record creation in Supabase.
  - `controllers/paymentController.ts`: Handles checkout sessions, webhooks, and payment methods.
  - `routes/paymentRoutes.ts`: Defines API endpoints for payment operations.
  - `controllers/webhookController.ts`: Handles non-Stripe webhooks (e.g., SendGrid).
- **Frontend Files**:
  - `/app/pricing/page.tsx`: Initiates checkout.
  - `/app/success/page.tsx`: Verifies payment status.
  - `/components/PaymentDetails.tsx`: Manages payment method updates.

## Environment Configuration
- **Development**: Uses test Stripe keys (`sk_test_...`) and `FRONTEND_URL=http://localhost:3000`.
- **Production**: Uses live keys (`sk_live_...`, `STRIPE_WEBHOOK_SECRET`) and `FRONTEND_URL=https://themonetarycatalyst.com`, deployed via Vercel.

## Security and Best Practices
- Webhooks are secured with `STRIPE_WEBHOOK_SECRET` signature verification.
- Rate limiting and monitoring (via Sentry) are recommended for production.
- All payment data is handled via Stripe’s PCI-compliant infrastructure, avoiding sensitive card details in your system.

## Production Considerations
- Ensure `/api/webhook` at `https://api.themonetarycatalyst.com/api/webhook` is registered in Stripe with live events (e.g., `invoice.payment_succeeded`).
- Test live payments and webhooks to confirm behavior matches development.
- Monitor for errors and implement retry logic for transient failures.

This summary ensures new team members can quickly grasp and contribute to the payment integration, aligning with the system’s current state and best practices.