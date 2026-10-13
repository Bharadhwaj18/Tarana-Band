import { Resend } from 'resend';

// onboarding@resend.dev is Resend's test sender: it only delivers to the Resend
// account owner. Set RESEND_FROM_EMAIL (e.g. "Tarana Band <orders@yourdomain.com>")
// once a domain is verified in Resend so customers actually receive emails.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Tarana Band <onboarding@resend.dev>';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Returns true only when Resend accepted the email
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !to) return false;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) {
      console.error(`Email to ${to} failed:`, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Email to ${to} failed:`, error);
    return false;
  }
}
