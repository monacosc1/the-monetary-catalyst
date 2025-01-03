# API Documentation

## Overview
The Monetary Catalyst API provides endpoints for authentication, content management, payment processing, and email services. All API responses follow a consistent format and use standard HTTP status codes.

## Base URL
```
Development: http://localhost:5000
Production: https://api.themonetarycatalyst.com
```

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Auth Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "termsAccepted": boolean
}

Response: 200 OK
{
  "user": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string"
  },
  "token": "string"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}

Response: 200 OK
{
  "user": {
    "id": "string",
    "email": "string"
  },
  "token": "string"
}
```

#### Google OAuth
```http
POST /api/auth/google-callback
Content-Type: application/json

{
  "user_id": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "google_id": "string"
}
```

## Payment & Subscription

### Create Checkout Session
```http
POST /api/create-checkout-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "string"
}

Response: 200 OK
{
  "url": "string" // Stripe Checkout URL
}
```

### Subscription Management
```http
POST /api/cancel-subscription
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}
```

### Payment Methods
```http
GET /api/get-payment-method
Authorization: Bearer <token>

Response: 200 OK
{
  "paymentMethod": {
    "id": "string",
    "brand": "string",
    "last4": "string",
    "expMonth": number,
    "expYear": number
  }
}
```

## Content Management

### Articles
```http
GET /api/articles
Query Parameters:
- page (number)
- limit (number)
- category (string)

Response: 200 OK
{
  "data": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "publishDate": "string",
      "category": "string"
    }
  ],
  "meta": {
    "total": number,
    "page": number,
    "totalPages": number
  }
}
```

### Newsletter
```http
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": "string",
  "name": "string",
  "source": "string"
}

Response: 200 OK
{
  "success": true,
  "message": "string"
}
```

## Contact & Support

### Contact Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "string",
  "email": "string",
  "message": "string",
  "recaptchaToken": "string"
}

Response: 200 OK
{
  "success": true
}
```

## Webhooks

### Stripe Webhooks
```http
POST /api/webhook
Content-Type: application/json
Stripe-Signature: <signature>

Response: 200 OK
```

### SendGrid Webhooks
```http
POST /api/email-events
Content-Type: application/json
X-Twilio-Email-Event-Webhook-Signature: <signature>

Response: 200 OK
```

## Error Responses
All endpoints follow this error format:
```json
{
  "error": "string",
  "code": "string",
  "details": "string" // Optional
}
```

Common Status Codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Unprocessable Entity
- 500: Internal Server Error

## Rate Limiting
```
Limit: 100 requests per 15 minutes per IP
Headers:
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset
```

## Development Notes
1. All timestamps are in ISO 8601 format
2. All IDs are strings
3. Authentication tokens expire after 24 hours
4. Webhook signatures must be verified
5. API versioning is handled through the URL path
