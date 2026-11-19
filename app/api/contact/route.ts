import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';
import { contactBandEmail } from '@/lib/emailTemplates';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate input
    if (!body.name || !body.email || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to database if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert([
          {
            name: body.name,
            email: body.email,
            phone: body.phone || null,
            message: body.message,
            submitted_at: new Date().toISOString(),
          },
        ]);

      if (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // Email the band from the verified domain; Reply goes straight to the sender
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      const sent = await sendEmail({
        to: process.env.ADMIN_EMAIL,
        replyTo: body.email,
        ...contactBandEmail(body),
      });

      if (!sent) {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


