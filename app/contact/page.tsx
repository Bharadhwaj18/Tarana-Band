'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { createClient } from '@supabase/supabase-js';

interface NavigationConfig {
  logo_black?: string;
  logo_white?: string;
  show_about?: boolean;
  show_tours?: boolean;
  show_merch?: boolean;
  show_videos?: boolean;
  show_contact?: boolean;
}

export default function ContactPage() {
  const [navConfig, setNavConfig] = useState<NavigationConfig>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchConfig = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        return;
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data: generalData } = await supabase
          .from('general_config')
          .select('*')
          .eq('is_active', true);

        if (generalData) {
          const generalConfig: any = {};
          generalData.forEach((item: any) => {
            generalConfig[item.section_name] = item.content;
          });

          const navigationConfig: NavigationConfig = {
            logo_black: generalConfig.branding?.logo_black,
            logo_white: generalConfig.branding?.logo_white,
            show_about: generalConfig.navigation?.show_about !== false,
            show_tours: generalConfig.navigation?.show_tours !== false,
            show_merch: generalConfig.navigation?.show_merch !== false,
            show_videos: generalConfig.navigation?.show_videos !== false,
            show_contact: generalConfig.navigation?.show_contact !== false,
          };

          setNavConfig(navigationConfig);
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
        // Reset success message after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An error occurred. Please try again later.');
      console.error('Error:', error);
    }
  };

  return (
    <main>
      <Navigation config={navConfig} />

      {/* Hero Section */}
      <section className="bg-black text-white py-10 sm:py-12">
        <div className="container-custom">
          <h1 className="heading-display mb-4 text-red-600">GET IN TOUCH</h1>
          <p className="text-lg sm:text-xl text-gray-300">
            Have a question or want to collaborate? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="container-custom max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                placeholder="Your name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                Phone Number <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors resize-none"
                placeholder="Your message..."
              />
            </div>

            {/* Status Messages */}
            {status === 'success' && (
              <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded">
                <p className="text-green-800 font-semibold">
                  ✓ Thank you! Your message has been sent. We'll get back to you soon.
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
                <p className="text-red-800 font-semibold">✗ {errorMessage}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </section>

      {/* Info Section */}
      {/* <section className="py-10 sm:py-12 bg-gray-50">
        <div className="container-custom">
          <h2 className="heading-lg text-center mb-12">Other Ways To Connect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="heading-md mb-2">Email</h3>
              <p className="text-gray-600">
                <a href="mailto:info@tarana.band" className="text-red-600 hover:text-red-700">
                  info@tarana.band
                </a>
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="heading-md mb-2">Social Media</h3>
              <p className="text-gray-600">
                Follow us on Instagram, YouTube, and other platforms
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="heading-md mb-2">Events</h3>
              <p className="text-gray-600">
                <a href="/tours" className="text-red-600 hover:text-red-700">
                  Check out our tour dates
                </a>
              </p>
            </div>
          </div>
        </div>
      </section> */}

      <Footer />
    </main>
  );
}
