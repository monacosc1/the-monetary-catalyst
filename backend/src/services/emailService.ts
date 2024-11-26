import sgMail from '@sendgrid/mail';
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

class EmailService {
  constructor() {
    // Set API key for all email operations
    sgMail.setApiKey(process.env.SENDGRID_CONTACT_FORM_KEY!);
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
    };
    return sgMail.send(msg);
  }

  // Transactional emails
  async sendWelcomeEmail(userEmail: string, firstName: string) {
    console.log('EmailService: Sending welcome email to:', userEmail);
    const msg = {
      to: userEmail,
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'The Monetary Catalyst'
      },
      templateId: 'd-16a5708cb9ed4700b8699efe181eda18',
      dynamicTemplateData: {
        name: firstName,
      },
      asm: {
        groupId: 25811,
        groupsToDisplay: [25811]
      },
    };
    console.log('EmailService: Email payload:', msg);
    return sgMail.send(msg);
  }

  async sendSubscriptionConfirmation(userEmail: string, userName: string, planType: string) {
    console.log('EmailService: Sending subscription confirmation to:', userEmail);
    const msg = {
      to: userEmail,
      from: {
        email: process.env.FROM_EMAIL!,
        name: 'The Monetary Catalyst'
      },
      templateId: 'd-02338cf0d38c4263b39be0ed4677454d',
      dynamicTemplateData: {
        firstName: userName,
        planType,
      },
      asm: {
        groupId: 25811,
        groupsToDisplay: [25811]
      },
    };
    console.log('EmailService: Email payload:', msg);
    return sgMail.send(msg);
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
    };
    
    console.log('EmailService: Email payload:', msg);
    return sgMail.send(msg);
  }
}

export const emailService = new EmailService();
