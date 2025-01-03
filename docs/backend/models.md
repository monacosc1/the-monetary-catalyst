# Data Models Documentation

## Overview
The Monetary Catalyst uses Supabase as its primary database, with models defined using TypeScript interfaces. These models represent the core data structures of the application.

## User Models

### User Profile
```typescript
interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  stripe_customer_id?: string;
  newsletter_subscribed: boolean;
  terms_accepted: boolean;
  created_at: string;
  updated_at: string;
}
```

Database Schema:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  stripe_customer_id TEXT UNIQUE,
  newsletter_subscribed BOOLEAN DEFAULT false,
  terms_accepted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Subscription Models

### Subscription
```typescript
interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled';
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_status: 'paid' | 'unpaid' | 'failed';
  created_at: string;
  updated_at: string;
}
```

Database Schema:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  payment_status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Content Models

### Article
```typescript
interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_id: string;
  category: 'market-analysis' | 'investment-ideas';
  status: 'draft' | 'published';
  feature_image_url?: string;
  publish_date: string;
  created_at: string;
  updated_at: string;
}
```

Database Schema:
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  feature_image_url TEXT,
  publish_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Newsletter Models

### Newsletter Subscription
```typescript
interface NewsletterUser {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'unsubscribed';
  source: string;
  subscribed_at: string;
  unsubscribed_at?: string;
  updated_at: string;
}
```

Database Schema:
```sql
CREATE TABLE newsletter_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  source TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Payment Models

### Payment Method
```typescript
interface PaymentMethod {
  id: string;
  user_id: string;
  stripe_payment_method_id: string;
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
```

Database Schema:
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  card_brand TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  card_exp_month INTEGER NOT NULL,
  card_exp_year INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Relationships

### User Relationships
- User -> Subscriptions (1:Many)
- User -> Articles (1:Many)
- User -> PaymentMethods (1:Many)

### Subscription Relationships
- Subscription -> User (Many:1)
- Subscription -> PaymentMethod (Many:1)

### Article Relationships
- Article -> User (Many:1)

## Indexes
```sql
-- User Profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Articles
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_status ON articles(status);

-- Newsletter Users
CREATE INDEX idx_newsletter_users_email ON newsletter_users(email);
CREATE INDEX idx_newsletter_users_status ON newsletter_users(status);

-- Payment Methods
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
```

## Data Integrity

### Foreign Key Constraints
- All `user_id` fields reference `auth.users(id)`
- Cascade deletion is disabled to prevent accidental data loss
- Stripe IDs are unique across their respective tables

### Timestamps
- All tables include `created_at` and `updated_at` fields
- `updated_at` is automatically updated on record modification

### Status Fields
- Use enumerated types for status fields
- Default values are set for required status fields
