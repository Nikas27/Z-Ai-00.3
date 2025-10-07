import { User, Payment, Email } from '../types';

// In a real app, this would use a service like SendGrid, Postmark, or AWS SES.
// For this demo, we'll log to the console and save to localStorage for review.

const EMAILS_KEY = 'z-ai-sent-emails';

// Helper functions to safely interact with localStorage
const getSentEmails = (): Email[] => {
    try {
        const item = localStorage.getItem(EMAILS_KEY);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
};

const saveEmail = (email: Email) => {
    const emails = getSentEmails();
    emails.push(email);
    localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));
};

const sendEmail = (to: string, subject: string, body: string): Email => {
    const email: Email = {
        id: `email-${Date.now()}`,
        to,
        subject,
        body,
        sentAt: new Date().toISOString(),
    };

    console.log(`
-------------------------------------
-- SIMULATING EMAIL SEND --
To: ${email.to}
Subject: ${email.subject}
-------------------------------------
${email.body}
-------------------------------------
    `);
    
    saveEmail(email);
    return email;
};

export const emailService = {
    /**
     * Sends an email confirming a successful payment and plan upgrade.
     */
    sendPaymentSuccessEmail: (user: User, payment: Payment) => {
        const subject = '✅ Your Z-Ai Pro Upgrade is Complete!';
        const body = `
Hi ${user.email.split('@')[0]},

Great news! Your payment of $${payment.amountPaid.toFixed(2)} via ${payment.methodName} has been successfully processed.

Your account has been upgraded to the Pro plan, and you now have access to all premium features, including:
- Unlimited image and video generations
- No watermarks on your creations
- Access to the Scene Studio and all advanced tools

Thank you for your purchase! You can view your receipt details in your Purchase History.

Happy creating!
- The Z-Ai Team
        `;
        return sendEmail(user.email, subject, body);
    },

    /**
     * Sends an email informing the user their payment is under review.
     */
    sendPaymentPendingEmail: (user: User, payment: Payment) => {
        const subject = '⏳ Your Z-Ai Payment is Under Review';
        const body = `
Hi ${user.email.split('@')[0]},

We've received your payment submission of $${payment.amountPaid.toFixed(2)} via ${payment.methodName}.

Your payment is currently being verified by our team. This process is usually completed within 24 hours.

We'll send you another email as soon as your payment is confirmed and your Pro plan is activated.

Thanks for your patience!
- The Z-Ai Team
        `;
        return sendEmail(user.email, subject, body);
    },

    /**
     * Sends an email informing the user that their payment was rejected.
     */
    sendPaymentRejectedEmail: (user: User, payment: Payment, reason: string) => {
        const subject = '❌ There Was an Issue With Your Z-Ai Payment';
        const body = `
Hi ${user.email.split('@')[0]},

Unfortunately, we were unable to process your recent payment attempt of $${payment.amountPaid.toFixed(2)} for the Z-Ai Pro plan.

Reason for rejection:
"${reason}"

What to do next:
Please review the reason above and try making the payment again. If you believe this is an error or need further assistance, please contact our support team.

We're here to help you get started.

- The Z-Ai Team
        `;
        return sendEmail(user.email, subject, body);
    },
    
    /**
     * Retrieves all sent emails (for admin panel).
     */
    getSentEmails,
};