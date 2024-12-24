import { NewsletterSubscription, NewsletterSubscriptionResponse } from '@/types/newsletter';

export const subscribeToNewsletter = async (data: NewsletterSubscription): Promise<NewsletterSubscriptionResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/newsletter/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to subscribe to newsletter');
  }

  return response.json();
}; 