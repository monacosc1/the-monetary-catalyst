export interface NewsletterSubscription {
  email: string;
  name: string;
  source: 'market-analysis' | 'investment-ideas';
}

export interface NewsletterSubscriptionResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    name: string;
    source: string;
    subscribed_at: string;
  };
} 