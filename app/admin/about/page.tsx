'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@supabase/supabase-js';

interface AboutConfig {
  hero_title: string;
  hero_description: string;
  story_title: string;
  story_paragraphs: string[];
}

export default function AdminAboutPage() {
  const [config, setConfig] = useState<AboutConfig>({
    hero_title: '',
    hero_description: '',
    story_title: '',
    story_paragraphs: ['', '', '']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('about_config')
      .select('content')
      .eq('section_name', 'about_page')
      .single();

    if (error) {
      console.error('Error fetching config:', error);
    } else if (data?.content) {
      setConfig(data.content as AboutConfig);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setMessage('Supabase not configured');
      setSaving(false);
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from('about_config')
      .upsert({
        section_name: 'about_page',
        content: config,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'section_name'
      });

    if (error) {
      console.error('Error saving config:', error);
      setMessage('Error saving changes');
    } else {
      setMessage('About page updated successfully!');
    }

    setSaving(false);
  };

  const updateParagraph = (index: number, value: string) => {
    const newParagraphs = [...config.story_paragraphs];
    newParagraphs[index] = value;
    setConfig({ ...config, story_paragraphs: newParagraphs });
  };

  const addParagraph = () => {
    setConfig({ ...config, story_paragraphs: [...config.story_paragraphs, ''] });
  };

  const removeParagraph = (index: number) => {
    const newParagraphs = config.story_paragraphs.filter((_, i) => i !== index);
    setConfig({ ...config, story_paragraphs: newParagraphs });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl">
        <h1 className="text-4xl font-bold text-gold mb-8">Edit About Page</h1>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
            {message}
          </div>
        )}

        {/* Hero Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gold mb-4">Hero Section</h2>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Hero Title</label>
            <input
              type="text"
              value={config.hero_title}
              onChange={(e) => setConfig({ ...config, hero_title: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
              placeholder="About TARANA"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Hero Description</label>
            <textarea
              value={config.hero_description}
              onChange={(e) => setConfig({ ...config, hero_description: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
              rows={3}
              placeholder="Brief description of the band..."
            />
          </div>
        </div>

        {/* Our Story Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gold mb-4">Our Story Section</h2>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Story Title</label>
            <input
              type="text"
              value={config.story_title}
              onChange={(e) => setConfig({ ...config, story_title: e.target.value })}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
              placeholder="Our Story"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Story Paragraphs</label>
            {config.story_paragraphs.map((paragraph, index) => (
              <div key={index} className="mb-4 flex gap-2">
                <textarea
                  value={paragraph}
                  onChange={(e) => updateParagraph(index, e.target.value)}
                  className="flex-1 p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                  rows={4}
                  placeholder={`Paragraph ${index + 1}...`}
                />
                {config.story_paragraphs.length > 1 && (
                  <button
                    onClick={() => removeParagraph(index)}
                    className="px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addParagraph}
              className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold-light"
            >
              + Add Paragraph
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href="/about"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600"
          >
            Preview About Page
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
