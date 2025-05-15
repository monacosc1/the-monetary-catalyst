<!-- docs/features/contact-form-and-recaptcha.md -->

# Feature Guide – Contact Form & Google reCAPTCHA v3

**Feature owner:** `@support`  
**Last major update:** 2024-03-19  
**Related tickets:** #61 "spam flood", #143 "auto-acknowledge email"

---

## 1. What the feature does

* Provides a **"Contact Us"** form on the `/contact` page.  
* Sends the message to the support inbox via **SendGrid** email service.  
* Uses **Google reCAPTCHA v3** to block spam/bot submissions (server verifies token).  
* Implements client-side form validation and server-side field validation.

---

## 2. End-to-end sequence

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant Frontend
    participant Backend
    participant GoogleRecaptcha
    participant SendGrid

    Client->>+Frontend: Fill form & click "Send"
    Frontend->>+GoogleRecaptcha: execute(siteKey, {action:"submit"})
    GoogleRecaptcha-->>-Frontend: token
    Frontend->>+Backend: POST /api/contact { name, email, message, recaptchaToken }
    Backend->>+GoogleRecaptcha: POST /siteverify secret,token
    GoogleRecaptcha-->>-Backend: { success:true, score:0.91 }
    alt score >= 0.5
        Backend->>+SendGrid: sendContactFormEmail(name, email, message)
        SendGrid-->>-Backend: 202
        Backend-->>-Frontend: 200 { success: true, message: "Email sent successfully" }
    else Bot / suspicious
        Backend-->>-Frontend: 400 { error: "reCAPTCHA verification failed" }
    end
    Frontend-->>Client: Toast success or error message
```

Diagram source: [`../diagrams/contact-form-seq.mmd`](../diagrams/contact-form-seq.mmd)

---

## 3. Data model highlights

The contact form does not currently store messages in a database. Messages are sent directly to the support email address via SendGrid.

---

## 4. Key code touch-points

| Layer | File | Purpose |
| ----- | ----------- | ------- |
| **Frontend page** | `frontend/app/contact/page.tsx` | Contact form with reCAPTCHA integration |
| **Backend route** | `backend/src/routes/contactRoutes.ts` | Handles POST /api/contact endpoint |
| **Email service** | `backend/src/services/emailService.ts` | SendGrid email sending implementation |
| **Webhook verification** | `backend/src/middleware/sendgridWebhookVerification.ts` | Verifies SendGrid webhook signatures |

---

## 5. Environment variables

| Name | Example | Used in |
| ---- | ------- | ------- |
| `RECAPTCHA_SECRET_KEY` | `6LcB…` | Backend verification call |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | `6LcB…` | Frontend grecaptcha.execute |
| `SENDGRID_CONTACT_FORM_KEY` | `SG.xxx` | SendGrid API key for contact form |
| `FROM_EMAIL` | `support@themonetarycatalyst.com` | Sender email address (also used as recipient) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Frontend API endpoint |

---

## 6. Error & edge-case behaviour

| Scenario | API response | Frontend handling |
| -------- | ------------ | ----------------- |
| Missing required fields | 400 `{ error: "Missing required fields", details: {...} }` | Form validation + inline errors |
| Invalid email format | Client-side validation | Prevents form submission |
| reCAPTCHA verification failed | 400 `{ error: "reCAPTCHA verification failed" }` | Toast error message |
| SendGrid error | 500 `{ error: "Failed to send message" }` | Toast error message |
| reCAPTCHA not loaded | Client-side error | Toast error message |

---

## 7. Open TODOs / Future work

* Add **auto-acknowledge** email back to sender.  
* Implement **rate limiting** per IP address.  
* Add **contact message storage** in database for audit purposes.  
* Add **form analytics** to track submission patterns.  

---

## 8. Changelog excerpts

* **2024-03-19** – Initial feature documentation created.
* **2024-03-18** – Added reCAPTCHA v3 integration.
* **2024-03-17** – Implemented SendGrid email service.
* **2024-03-16** – Created contact form page.
