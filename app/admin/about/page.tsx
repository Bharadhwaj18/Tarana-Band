'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_HEADLINE_STAGES, DEFAULT_MORE_STAGES, cleanStageList } from '@/lib/aboutStages';

interface AboutConfig {
  hero_title: string;
  hero_description: string;
  story_title: string;
  story_paragraphs: string[];
  stages_headline: string[];
  stages_more: string[];
}

export default function AdminAboutPage() {
  const [config, setConfig] = useState<AboutConfig>({
    hero_title: '',
    hero_description: '',
    story_title: '',
    story_paragraphs: ['', '', ''],
    stages_headline: DEFAULT_HEADLINE_STAGES,
    stages_more: DEFAULT_MORE_STAGES,
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
      .from('general_config')
      .select('content')
      .eq('section_name', 'about_page')
      .single();

    if (error) {
      console.error('Error fetching config:', error);
    } else if (data?.content) {
      // Stage lists saved before this existed fall back to the defaults
      const saved = data.content as Partial<AboutConfig>;
      setConfig((prev) => ({
        ...prev,
        ...saved,
        stages_headline: Array.isArray(saved.stages_headline) ? saved.stages_headline : DEFAULT_HEADLINE_STAGES,
        stages_more: Array.isArray(saved.stages_more) ? saved.stages_more : DEFAULT_MORE_STAGES,
      }));
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
      .from('general_config')
      .upsert({
        section_name: 'about_page',
        content: {
          ...config,
          stages_headline: cleanStageList(config.stages_headline),
          stages_more: cleanStageList(config.stages_more),
        },
        is_active: true,
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

        {/* Stages Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gold mb-1">Stages We&apos;ve Played</h2>
          <p className="text-gray-400 text-sm mb-4">
            The &quot;As seen on stage at&quot; strip on the About page. Type one name per line. Leave both boxes empty to
            hide the strip.
          </p>

          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Big names (shown in large letters)</label>
            <textarea
              value={config.stages_headline.join('\n')}
              onChange={(e) => setConfig({ ...config, stages_headline: e.target.value.split('\n') })}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
              rows={6}
              placeholder={'Bengaluru Ganesh Utsava\nUdupi Paryaya'}
            />
            <p className="text-gray-500 text-xs mt-1">Festivals and big events. Order here is the order on the page.</p>
          </div>

          <div className="mb-2">
            <label className="block text-gray-300 mb-2">More stages (shown smaller underneath)</label>
            <textarea
              value={config.stages_more.join('\n')}
              onChange={(e) => setConfig({ ...config, stages_more: e.target.value.split('\n') })}
              className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
              rows={8}
              placeholder={'DSCE\nOrion Mall'}
            />
            <p className="text-gray-500 text-xs mt-1">Colleges, malls and other venues.</p>
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
