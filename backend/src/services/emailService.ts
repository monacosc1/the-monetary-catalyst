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
}

export const emailService = new EmailService();
