import sgMail from '@sendgrid/mail';

class EmailService {
  constructor() {
    // Set API key for all email operations
    sgMail.setApiKey(process.env.SENDGRID_CONTACT_FORM_KEY!);
  }

  // Contact form emails
  async sendContactFormEmail(name: string, email: string, message: string) {
    const msg = {
      to: 'support@themonetarycatalyst.com',
      from: process.env.FROM_EMAIL!,
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
  async sendWelcomeEmail(userEmail: string, userName: string) {
    const msg = {
      to: userEmail,
      from: process.env.FROM_EMAIL!,
      templateId: 'd-xxxxx', // Your SendGrid template ID
      dynamicTemplateData: {
        name: userName,
      },
    };
    return sgMail.send(msg);
  }

  async sendSubscriptionConfirmation(userEmail: string, userName: string, planType: string) {
    const msg = {
      to: userEmail,
      from: process.env.FROM_EMAIL!,
      templateId: 'd-yyyyy', // Your SendGrid template ID
      dynamicTemplateData: {
        name: userName,
        planType,
      },
    };
    return sgMail.send(msg);
  }

  async sendNewArticleNotification(subscribers: Array<{email: string, name: string}>, articleData: any) {
    const msg = {
      to: subscribers.map(sub => sub.email),
      from: process.env.FROM_EMAIL!,
      templateId: 'd-zzzzz', // Your SendGrid template ID
      dynamicTemplateData: {
        articleTitle: articleData.title,
        articleUrl: articleData.url,
        // other article data
      },
    };
    return sgMail.send(msg);
  }
}

export const emailService = new EmailService();
