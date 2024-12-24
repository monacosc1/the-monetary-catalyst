'use client';

import { useState } from 'react';
import { subscribeToNewsletter } from '@/services/newsletterService';
import { toast } from 'react-hot-toast';

interface NewsletterFormProps {
  source: 'market-analysis' | 'investment-ideas';
}

export default function NewsletterForm({ source }: NewsletterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await subscribeToNewsletter({
        name,
        email,
        source,
      });

      // Clear form
      setName('');
      setEmail('');

      // Show success message
      toast.success(response.message);

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe to newsletter');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Monthly Newsletter Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          required
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
        <input
          type="email"
          placeholder="Email"
          required
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-primary text-white p-2 rounded hover:bg-accent1 transition-colors ${
            isLoading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </button>
      </form>
    </div>
  );
} 