import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const adminEmail = process.env.ADMIN_EMAIL || 'noreply@resend.dev';

      const emailResponse = await resend.emails.send({
        from: 'Tarana Band <onboarding@resend.dev>',
        to: adminEmail,
        replyTo: body.email,
        subject: `New Contact Form Submission from ${body.name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  background-color: #f5f5f5;
                  margin: 0;
                  padding: 0;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 8px;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                  overflow: hidden;
                }
                .header {
                  background: linear-gradient(135deg, #1a5f3b 0%, #2d8a5d 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 600;
                }
                .header p {
                  margin: 5px 0 0 0;
                  font-size: 14px;
                  opacity: 0.9;
                }
                .content {
                  padding: 30px;
                }
                .field {
                  margin-bottom: 24px;
                }
                .label {
                  font-weight: 600;
                  color: #1a5f3b;
                  font-size: 13px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  margin-bottom: 6px;
                }
                .value {
                  color: #333333;
                  font-size: 15px;
                  line-height: 1.6;
                  word-wrap: break-word;
                }
                .message-box {
                  background-color: #f9f9f9;
                  border-left: 4px solid #FFD700;
                  padding: 16px;
                  margin-top: 6px;
                  border-radius: 4px;
                }
                .divider {
                  height: 1px;
                  background-color: #e0e0e0;
                  margin: 24px 0;
                }
                .footer {
                  background-color: #f5f5f5;
                  padding: 20px;
                  text-align: center;
                  font-size: 12px;
                  color: #666666;
                  border-top: 1px solid #e0e0e0;
                }
                .footer a {
                  color: #1a5f3b;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>New Message from Your Website</h1>
                  <p>Someone wants to get in touch</p>
                </div>

                <div class="content">
                  <div class="field">
                    <div class="label">Name</div>
                    <div class="value">${body.name}</div>
                  </div>

                  <div class="field">
                    <div class="label">Email</div>
                    <div class="value"><a href="mailto:${body.email}" style="color: #1a5f3b; text-decoration: none;">${body.email}</a></div>
                  </div>

                  ${body.phone ? `
                  <div class="field">
                    <div class="label">Phone</div>
                    <div class="value"><a href="tel:${body.phone}" style="color: #1a5f3b; text-decoration: none;">${body.phone}</a></div>
                  </div>
                  ` : ''}

                  <div class="divider"></div>

                  <div class="field">
                    <div class="label">Message</div>
                    <div class="message-box">
                      <div class="value">${body.message.replace(/\n/g, '<br>')}</div>
                    </div>
                  </div>
                </div>

                <div class="footer">
                  <p>This message was sent from your website contact form.</p>
                  <p>Reply directly to this email to respond to the sender.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (emailResponse.error) {
        console.error('Email error:', emailResponse.error);
        return NextResponse.json(
          { error: 'Failed to send email' },
          { status: 500 }
        );
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


