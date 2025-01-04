'use client'

import React, { useState, useEffect } from 'react';
import DotPattern from '@/components/DotPattern';
import { toast, Toaster } from 'react-hot-toast';

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load reCAPTCHA script
    const loadRecaptcha = async () => {
      try {
        // Remove any existing reCAPTCHA scripts first
        const existingScript = document.querySelector('script[src*="recaptcha"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        // Wait for script to load
        script.onload = () => {
          window.grecaptcha.ready(() => {
            console.log('reCAPTCHA is ready');
          });
        };
      } catch (error) {
        console.error('Error loading reCAPTCHA:', error);
      }
    };

    loadRecaptcha();

    // Cleanup
    return () => {
      const script = document.querySelector('script[src*="recaptcha"]');
      if (script) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Make sure grecaptcha is available
      if (!window.grecaptcha) {
        throw new Error('reCAPTCHA not loaded');
      }

      // Wait for reCAPTCHA to be ready
      await new Promise<void>((resolve) => window.grecaptcha.ready(resolve));

      // Get reCAPTCHA token
      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
        { action: 'submit' }
      );

      console.log('Generated token:', token); // For debugging

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          recaptchaToken: token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      toast.success('Message sent successfully!');
      setName('');
      setEmail('');
      setMessage('');
    } catch (error: Error | unknown) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-dark text-white min-h-screen py-12 relative">
      <Toaster position="top-center" />
      <DotPattern />
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="md:w-1/2 bg-white p-8 rounded-lg shadow-xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Get in touch with<br />The Monetary Catalyst
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Complete the form on this page to send an email to our support. 
              Alternatively, send an email as you prefer to the email address below. 
              We&apos;ll respond as soon as we can.
            </p>
            <p className="text-lg font-semibold text-gray-800">
              Email: <a href="mailto:support@themonetarycatalyst.com" className="text-primary hover:text-accent1">support@themonetarycatalyst.com</a>
            </p>
          </div>
          <div className="md:w-1/2 bg-white p-8 rounded-lg shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-gray-900"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                ></textarea>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-accent1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
