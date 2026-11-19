'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer, { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/components/Footer';
import { useAppConfig } from '@/components/AppConfigProvider';
import { trackEvent } from '@/lib/analytics';

// Topic chips only pre-fill the start of the message; the form sends exactly the same fields
const TOPICS = [
  { label: 'Booking a show', prefix: 'Booking enquiry: ' },
  { label: 'Collab', prefix: 'Collab idea: ' },
  { label: 'Merch / order', prefix: 'About merch: ' },
  { label: 'Just saying hi', prefix: 'Hi Tarana! ' },
];

export default function ContactPage() {
  const { socialConfig } = useAppConfig();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [topic, setTopic] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const pickTopic = (label: string, prefix: string) => {
    setTopic(label);
    setFormData((prev) => {
      // Swap the previous topic's prefix, or add one to an empty message
      const previous = TOPICS.find((t) => prev.message.startsWith(t.prefix));
      const body = previous ? prev.message.slice(previous.prefix.length) : prev.message;
      return { ...prev, message: prefix + body };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (response.ok) {
        trackEvent('contact_form_submit');
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
        setTopic(null);
        setTimeout(() => setStatus('idle'), 6000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again, or email us directly.');
      console.error('Error:', error);
    }
  };

  const socialLinks = socialConfig.social_links || [];

  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="gp-container pt-12 sm:pt-14 pb-20 sm:pb-24 flex flex-wrap gap-14 items-start">
        <div className="flex-[1_1_440px] min-w-0">
          <p className="gp-mono text-sm uppercase mb-3">Bookings · collabs · hello</p>
          <h1 className="gp-display text-[clamp(60px,7.5vw,128px)] leading-[0.84]">
            Get in
            <br />
            <span className="text-poster">touch.</span>
          </h1>
          <p className="mt-7 mb-10 text-lg sm:text-[19px] leading-normal max-w-[40ch]">
            Have a question or want to collaborate? We&apos;d love to hear from you.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex justify-between items-center gap-4 p-5 sm:p-6 bg-ink text-paper mb-4 hover:bg-poster transition-colors"
          >
            <span className="min-w-0">
              <span className="block gp-mono text-xs uppercase text-poster-light">Email · bookings &amp; inquiries</span>
              <span className="block mt-1.5 font-poster text-lg sm:text-[clamp(20px,2.2vw,30px)] break-all">
                {CONTACT_EMAIL}
              </span>
            </span>
            <span aria-hidden="true" className="text-3xl">↗</span>
          </a>
          <a
            href={CONTACT_PHONE_HREF}
            className="flex justify-between items-center gap-4 p-5 sm:p-6 border-[3px] border-ink hover:bg-ink hover:text-paper transition-colors"
          >
            <span>
              <span className="block gp-mono text-xs uppercase">Call us</span>
              <span className="block mt-1.5 font-poster text-lg sm:text-[clamp(20px,2.2vw,30px)]">{CONTACT_PHONE}</span>
            </span>
            <span aria-hidden="true" className="text-3xl">↗</span>
          </a>

          {socialLinks.length > 0 && (
            <nav aria-label="Follow us" className="flex flex-wrap gap-2.5 mt-6 gp-mono text-sm font-bold">
              {socialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-ink px-3.5 py-2.5 hover:bg-ink hover:text-paper transition-colors"
                >
                  {link.platform}
                </a>
              ))}
            </nav>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-[1_1_500px] min-w-0 bg-white border-[3px] border-ink shadow-hard-red"
        >
          <h2 className="px-5 sm:px-6 py-4 border-b-[3px] border-ink font-poster uppercase text-2xl sm:text-[28px]">
            Send us a message
          </h2>
          <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="gp-label sm:col-span-2">
              Name
              <input type="text" name="name" value={formData.name} onChange={handleChange} required autoComplete="name" className="gp-input" />
            </label>
            <label className="gp-label">
              Email
              <input type="email" name="email" value={formData.email} onChange={handleChange} required autoComplete="email" className="gp-input" />
            </label>
            <label className="gp-label">
              <span>
                Phone number <span className="font-normal normal-case">(optional)</span>
              </span>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} autoComplete="tel" placeholder="+91 98765 43210" className="gp-input" />
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="gp-mono text-[13px] font-bold uppercase mb-2">
                What&apos;s it about? <span className="font-normal normal-case">(optional)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    aria-pressed={topic === t.label}
                    onClick={() => pickTopic(t.label, t.prefix)}
                    className={`min-h-[44px] px-4 border-2 border-ink font-bold ${
                      topic === t.label ? 'bg-ink text-paper' : 'bg-white hover:bg-paper'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="gp-label sm:col-span-2">
              Message
              <textarea name="message" value={formData.message} onChange={handleChange} required rows={6} className="gp-input resize-y" />
            </label>

            {status === 'success' && (
              <p role="status" className="sm:col-span-2 gp-mono text-sm p-4 bg-ink text-paper">
                ✓ Sent! Thanks for writing. We&apos;ll reply to your email soon.
              </p>
            )}
            {status === 'error' && (
              <p role="alert" className="sm:col-span-2 gp-mono text-sm p-4 border-[3px] border-poster text-poster-dark bg-[#FFF4F2]">
                ✗ {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="sm:col-span-2 gp-btn gp-btn-red min-h-[60px] text-lg uppercase tracking-wide disabled:opacity-60"
            >
              {status === 'loading' ? 'Sending…' : 'Send message →'}
            </button>
          </div>
        </form>
      </section>

      <Footer />
    </main>
  );
}
