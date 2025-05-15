<!-- docs/reference/api-endpoints.md -->

# Reference – API Endpoints (Backend)

> **Base URL**  
> Production: `https://api.themonetarycatalyst.com`  
> Local dev: `http://localhost:4000`

| Group | Method & Path | Auth? | Purpose | Controller / File |
| ----- | ------------- | ----- | ------- | ----------------- |
| **Auth** | `POST /api/auth/register` | No | Create user, return JWT & profile | `authController.registerUser` |
|  | `POST /api/auth/login` | No | Login email+password | `authController.loginUser` |
|  | `POST /api/auth/google-callback` | No | Upsert profile after OAuth | `authController.googleCallback` |
|  | `GET /api/auth/profile` | **Yes** | Return profile | `authController.getUserProfile` |
|  | `POST /api/auth/reset-password` | No | Send reset link email | `authController.handleResetPassword` |
|  | `POST /api/auth/welcome-email` | No | Send welcome email | `emailService.sendWelcomeEmail` |
| **Content** | `GET /api/content/articles` | No | List articles (query params: `page`, `pageSize`, `type`) | `contentRoutes.listArticles` |
|  | `GET /api/content/articles/:slug` | *Optional* (JWT) | Fetch single article; 403 if gated | `contentRoutes.getArticle` |
| **Payments** | `POST /api/create-checkout-session` | **Yes** | Stripe Checkout session | `paymentController.createCheckoutSession` |
|  | `GET /api/verify-session` | **Yes** | Confirm Stripe session success | `paymentController.verifySession` |
|  | `POST /api/create-setup-intent` | **Yes** | Add / update card | `paymentController.createSetupIntent` |
|  | `GET /api/get-payment-method` | **Yes** | Retrieve default card | `paymentController.getPaymentMethod` |
|  | `POST /api/cancel-subscription` | **Yes** | Cancel at period end | `paymentController.cancelSubscription` |
| **Webhooks** | `POST /api/webhook` | Stripe signature | Stripe subscription events | `paymentController.handleWebhook` |
|  | `POST /api/webhook/sendgrid` | SendGrid signature | Email bounces/unsubs | `webhookController.handleSendGridWebhook` |
| **Newsletter** | `POST /api/newsletter/subscribe` | No | Add / update newsletter user | `newsletterController.subscribeToNewsletter` |
| **Contact** | `POST /api/contact` | No | reCAPTCHA verify + email to support | `contactController.submitForm` |
| **Health** | `GET /health` | No | Liveness probe | inline in `app.ts` |

### Conventions

* **Auth?** column:
  * `No` – public
  * `Yes` – requires valid Supabase JWT bearer token
  * "Stripe signature" / "SendGrid signature" – third-party webhook validation
* All endpoints return **JSON**; errors follow shape:

```ts
{
  "error": "Message",
  "details": { ... }   // optional
}
```

### Rate Limiting

* API endpoints: 100 requests per 15 minutes per IP
* Webhook endpoints: 100 requests per 15 minutes per IP
* Health check: No rate limiting

### CORS

* Production: `https://app.themonetarycatalyst.com`
* Development: `http://localhost:3000`

---  
*Updated: 2024-03-19*
