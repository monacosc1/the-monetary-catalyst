import sgMail, { MailDataRequired, ClientResponse } from '@sendgrid/mail';
import crypto from 'crypto';

// Define our own interface for SendGrid errors
interface SendGridErrorResponse {
  response?: {
    body?: any;
    statusCode?: number;
    headers?: Record<string, any>;
  };
  code?: string;
  message?: string;
}

// Add this interface to handle template-based emails
interface TemplateMailData extends Omit<MailDataRequired, 'content'> {
  templateId: string;
  dynamicTemplateData?: Record<string, any>;
}

class EmailService {
  constructor() {
    // Set default API key for most email operations
    sgMail.setApiKey(process.env.SENDGRID_CONTACT_FORM_KEY!);
    
    // Enable automatic purging of bounces and blocks
    this.configureBounceSettings();
  }

  private async configureBounceSettings() {
    try {
      await fetch('https://api.sendgrid.com/v3/mail_settings/bounce_purge', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_CONTACT_FORM_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: true,
          hard_bounces: 5, // Days to retain hard bounces
          soft_bounces: 3  // Days to retain soft bounces
        })
      });
    } catch (error) {
      console.error('Failed to configure bounce settings:', error);
    }
  }

  // Contact form emails
  async sendContactFormEmail(name: string, email: string, message: string) {
    const msg = {
      to: 'support@themonetarycatalyst.com',
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'The Monetary Catalyst'
      },
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      headers: {
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': crypto.randomBytes(32).toString('hex'),
        'X-VPS-Request-ID': `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`,
        'X-VPS-Sender-IP': process.env.SENDGRID_IP || '',
        'Feedback-ID': `${process.env.SENDGRID_CONTACT_FORM_KEY}:contact-form:${Date.now()}`,
        'List-ID': '<contact-form.themonetarycatalyst.com>',
        'Message-ID': `<${crypto.randomBytes(20).toString('hex')}@themonetarycatalyst.com>`
      }
    };
    return sgMail.send(msg);
  }

  // Add this method to the EmailService class
  private getDelayForProvider(email: string): number {
    const domain = email.split('@')[1].toLowerCase();
    switch (domain) {
      case 'yahoo.com':
      case 'yahoo.co.uk':
        return 2000; // 2 second delay
      case 'outlook.com':
      case 'hotmail.com':
        return 1000; // 1 second delay
      default:
        return 0;
    }
  }

  // Transactional emails
  async sendWelcomeEmail(userEmail: string, firstName: string | null) {
    console.log('EmailService: Sending welcome email to:', userEmail);
    
    // Add delay based on email provider
    const delay = this.getDelayForProvider(userEmail);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const msg: TemplateMailData = {
      to: userEmail,
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'The Monetary Catalyst'
      },
      templateId: 'd-16a5708cb9ed4700b8699efe181eda18',
      dynamicTemplateData: {
        firstName: firstName || '',
      },
      asm: {
        groupId: 25811,
        groupsToDisplay: [25811]
      },
      headers: {
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': crypto.randomBytes(32).toString('hex'),
        'X-VPS-Request-ID': `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`,
        'X-VPS-Sender-IP': process.env.SENDGRID_IP || '',
        'Feedback-ID': `${process.env.SENDGRID_CONTACT_FORM_KEY}:welcome:${Date.now()}`,
        'List-ID': '<welcome.themonetarycatalyst.com>',
        'Message-ID': `<${crypto.randomBytes(20).toString('hex')}@themonetarycatalyst.com>`
      }
    };
    console.log('EmailService: Email payload:', msg);
    
    try {
      const result = await sgMail.send(msg as MailDataRequired);
      
      // Add logging for successful sends
      console.log('Welcome email sent successfully:', {
        to: userEmail,
        messageId: result[0].headers['x-message-id'],
        statusCode: result[0].statusCode
      });
      
      return { success: true, result };
    } catch (error) {
      // Enhanced error logging
      console.error('Failed to send welcome email:', {
        to: userEmail,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      // Start the retry process in the background
      this.retryEmail(msg)
        .then(result => {
          if (result) {
            console.log('Retry successful for:', userEmail);
          } else {
            console.error('All retry attempts failed for:', userEmail);
          }
        })
        .catch(retryError => {
          console.error('Error in retry process:', retryError);
        });
      
      return { 
        success: false, 
        error: 'Welcome email delivery delayed. It will be retried automatically.' 
      };
    }
  }

  async sendSubscriptionConfirmation(
    userEmail: string, 
    firstName: string | null, 
    planType: string,
    subscriptionType: string = 'professional'
  ) {
    try {
      // Add rate limiting
      const delay = this.getDelayForProvider(userEmail);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const msg = {
        to: userEmail,
        from: {
          email: process.env.FROM_EMAIL!,
          name: 'The Monetary Catalyst'
        },
        templateId: 'd-02338cf0d38c4263b39be0ed4677454d',
        dynamicTemplateData: {
          firstName: firstName || '',
          planType: planType,
          subscriptionType: subscriptionType
        },
        asm: {
          groupId: 25811,
          groupsToDisplay: [25811]
        },
        headers: {
          'Precedence': 'bulk',
          'X-Entity-Ref-ID': crypto.randomBytes(32).toString('hex'),
          'X-VPS-Request-ID': `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`,
          'X-VPS-Sender-IP': process.env.SENDGRID_IP || '',
          'Feedback-ID': `${process.env.SENDGRID_CONTACT_FORM_KEY}:subscription:${Date.now()}`,
          'List-ID': '<subscription.themonetarycatalyst.com>',
          'Message-ID': `<${crypto.randomBytes(20).toString('hex')}@themonetarycatalyst.com>`
        }
      };
      console.log('EmailService: Email payload:', msg);
      return await sgMail.send(msg);
    } catch (error) {
      console.error('Failed to send subscription confirmation:', error);
      return null;
    }
  }

  async sendNewArticleNotification(subscribers: Array<{email: string, name: string}>, articleData: {
    title: string;
    excerpt: string;
    featureImageUrl: string;
    articleUrl: string;
    category: 'market-analysis' | 'investment-ideas';
  }) {
    const templateId = articleData.category === 'market-analysis' 
      ? 'd-your-market-analysis-template-id'
      : 'd-your-investment-ideas-template-id';

    const msg = {
      to: subscribers.map(sub => sub.email),
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'The Monetary Catalyst'
      },
      templateId: templateId,
      dynamicTemplateData: {
        title: articleData.title,
        excerpt: articleData.excerpt,
        featureImageUrl: articleData.featureImageUrl,
        articleUrl: articleData.articleUrl,
      },
      headers: {
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': crypto.randomBytes(32).toString('hex'),
        'X-VPS-Request-ID': `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`,
        'X-VPS-Sender-IP': process.env.SENDGRID_IP || '',
        'Feedback-ID': `${process.env.SENDGRID_CONTACT_FORM_KEY}:article-notification:${Date.now()}`,
        'List-ID': '<notifications.themonetarycatalyst.com>',
        'Message-ID': `<${crypto.randomBytes(20).toString('hex')}@themonetarycatalyst.com>`
      }
    };
    return sgMail.send(msg);
  }

  // Add this test method
  async testSMTP() {
    // Use the transactional key for this test
    sgMail.setApiKey(process.env.SUPABASE_SMTP_KEY!);
    
    const msg = {
      to: 'samonaco1@yahoo.com', // Your actual email
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'The Monetary Catalyst'
      },
      subject: 'SendGrid Domain Authentication Test',
      text: 'This is a test email to verify SendGrid configuration',
      html: '<strong>This is a test email to verify SendGrid configuration</strong>',
    };

    try {
      const result = await sgMail.send(msg);
      console.log('Test email sent successfully:', {
        response: result[0].statusCode,
        headers: result[0].headers,
      });
      return result;
    } catch (error: unknown) {
      console.error('SMTP test failed:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const sendGridError = error as SendGridErrorResponse;
        console.error('Detailed error response:', {
          body: sendGridError.response?.body,
          statusCode: sendGridError.response?.statusCode,
          headers: sendGridError.response?.headers,
          code: sendGridError.code,
          message: sendGridError.message
        });
      }
      throw error;
    }
  }

  async sendPasswordResetEmail(userEmail: string, recoveryLink: string) {
    console.log('EmailService: Sending password reset email to:', userEmail);
    
    // Create a new SendGrid instance with SMTP key specifically for password reset
    const resetMailer = require('@sendgrid/mail');
    resetMailer.setApiKey(process.env.SUPABASE_SMTP_KEY!);
    
    const msg = {
      to: userEmail,
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'The Monetary Catalyst'
      },
      subject: 'Reset Your Password - The Monetary Catalyst',
      html: `
        <p>Hello,</p>
        <p>Someone has requested a password reset for your account. If this was you, please click the link below to reset your password:</p>
        <p><a href="${recoveryLink}">Reset Password</a></p>
        <p>If you didn't request this change, you can safely ignore this email.</p>
        <p>This link will expire in 30 minutes.</p>
        <p>Best regards,<br>The Monetary Catalyst Team</p>
      `,
      asm: {
        groupId: 25811,
        groupsToDisplay: [25811]
      },
      headers: {
        'Precedence': 'bulk',
        'X-Entity-Ref-ID': crypto.randomBytes(32).toString('hex'),
        'X-VPS-Request-ID': `${Date.now()}-${crypto.randomBytes(16).toString('hex')}`,
        'X-VPS-Sender-IP': process.env.SENDGRID_IP || '',
        'Feedback-ID': `${process.env.SUPABASE_SMTP_KEY}:password-reset:${Date.now()}`,
        'List-ID': '<password-reset.themonetarycatalyst.com>',
        'Message-ID': `<${crypto.randomBytes(20).toString('hex')}@themonetarycatalyst.com>`
      }
    };
    
    return resetMailer.send(msg);
  }

  private async retryEmail(
    msg: TemplateMailData, 
    retryCount = 0, 
    maxRetries = 3
  ): Promise<[ClientResponse, {}] | null> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minute delay
      return await sgMail.send(msg as MailDataRequired);
    } catch (error) {
      if (retryCount < maxRetries) {
        console.log(`Retry attempt ${retryCount + 1} for email to ${msg.to}`);
        return this.retryEmail(msg, retryCount + 1);
      }
      console.error(`Failed to send email after ${maxRetries} attempts:`, error);
      return null;
    }
  }

  // Update the validateEmail method
  async validateEmail(email: string) {
    // Basic regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const emailService = new EmailService();
