'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface SocialLink {
  platform: string;
  url: string;
}

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Branding
  const [logoBlack, setLogoBlack] = useState('');
  const [logoWhite, setLogoWhite] = useState('');
  const [logoBlackPath, setLogoBlackPath] = useState('');
  const [logoWhitePath, setLogoWhitePath] = useState('');
  const [logoBlackUploading, setLogoBlackUploading] = useState(false);
  const [logoWhiteUploading, setLogoWhiteUploading] = useState(false);

  // Navigation visibility
  const [showAbout, setShowAbout] = useState(true);
  const [showTours, setShowTours] = useState(true);
  const [showMerch, setShowMerch] = useState(true);
  const [showVideos, setShowVideos] = useState(true);
  const [showContact, setShowContact] = useState(true);

  // Fonts
  const [displayFont, setDisplayFont] = useState('Righteous');
  const [bodyFont, setBodyFont] = useState('Poppins');

  // Social links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');

  const googleFonts = [
    'Righteous',
    'Bebas Neue',
    'Oswald',
    'Playfair Display',
    'Montserrat',
    'Raleway',
    'Poppins',
    'Inter',
    'Roboto',
    'Lato',
  ];

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }
      setUser(user);
      await fetchConfig();
    };
    checkAuth();
  }, [router]);

  const fetchConfig = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('general_config')
        .select('*')
        .eq('is_active', true);

      if (data) {
        data.forEach((item: any) => {
          const content = item.content;
          switch (item.section_name) {
            case 'branding':
              setLogoBlack(content.logo_black || '');
              setLogoWhite(content.logo_white || '');
              setLogoBlackPath(content.logo_storage_path_black || '');
              setLogoWhitePath(content.logo_storage_path_white || '');
              break;
            case 'navigation':
              setShowAbout(content.show_about !== false);
              setShowTours(content.show_tours !== false);
              setShowMerch(content.show_merch !== false);
              setShowVideos(content.show_videos !== false);
              setShowContact(content.show_contact !== false);
              break;
            case 'fonts':
              setDisplayFont(content.display_font || 'Righteous');
              setBodyFont(content.body_font || 'Poppins');
              break;
            case 'social':
              setSocialLinks(content.social_links || []);
              break;
          }
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching config:', error);
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File, isBlack: boolean) => {
    if (!supabase) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Logo file too large. Maximum 5MB allowed.');
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setMessage('Invalid image format. Please use PNG, JPEG, or SVG.');
      return;
    }

    if (isBlack) {
      setLogoBlackUploading(true);
    } else {
      setLogoWhiteUploading(true);
    }

    try {
      // Delete old logo if exists
      if (isBlack && logoBlackPath) {
        await supabase.storage.from('photos').remove([logoBlackPath]);
      } else if (!isBlack && logoWhitePath) {
        await supabase.storage.from('photos').remove([logoWhitePath]);
      }

      const fileName = `${isBlack ? 'black' : 'white'}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `logos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      if (isBlack) {
        setLogoBlack(urlData.publicUrl);
        setLogoBlackPath(filePath);
        setMessage('✓ Black logo uploaded successfully!');
      } else {
        setLogoWhite(urlData.publicUrl);
        setLogoWhitePath(filePath);
        setMessage('✓ White logo uploaded successfully!');
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      setMessage(`Error: ${error?.message || 'Upload failed'}`);
    }

    if (isBlack) {
      setLogoBlackUploading(false);
    } else {
      setLogoWhiteUploading(false);
    }
  };

  const removeLogo = (isBlack: boolean) => {
    if (isBlack) {
      setLogoBlack('');
      setLogoBlackPath('');
    } else {
      setLogoWhite('');
      setLogoWhitePath('');
    }
  };

  const addSocialLink = () => {
    if (!newSocialPlatform || !newSocialUrl) {
      setMessage('Please fill in both platform and URL');
      return;
    }

    setSocialLinks([...socialLinks, { platform: newSocialPlatform, url: newSocialUrl }]);
    setNewSocialPlatform('');
    setNewSocialUrl('');
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const saveConfig = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage('');

    try {
      const sections = [
        {
          section_name: 'branding',
          content: {
            logo_black: logoBlack,
            logo_white: logoWhite,
            logo_storage_path_black: logoBlackPath,
            logo_storage_path_white: logoWhitePath,
          },
        },
        {
          section_name: 'navigation',
          content: {
            show_about: showAbout,
            show_tours: showTours,
            show_merch: showMerch,
            show_videos: showVideos,
            show_contact: showContact,
          },
        },
        {
          section_name: 'fonts',
          content: {
            display_font: displayFont,
            body_font: bodyFont,
          },
        },
        {
          section_name: 'social',
          content: {
            social_links: socialLinks,
          },
        },
      ];

      for (const section of sections) {
        await supabase
          .from('general_config')
          .upsert(
            {
              ...section,
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'section_name',
            }
          );
      }

      setMessage('✓ Settings saved successfully! Changes will appear on the website shortly.');
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Error saving settings');
    }

    setSaving(false);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gold">General Settings</h1>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600"
          >
            Preview Website
          </a>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Branding Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-6">Branding</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Black Logo */}
              <div>
                <label className="block text-gray-300 font-semibold mb-3">Logo for Light Backgrounds (Black)</label>
                {logoBlack ? (
                  <div className="space-y-3">
                    <div className="bg-white p-4 rounded-lg">
                      <img src={logoBlack} alt="Black Logo" className="h-20 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLogo(true)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Remove Black Logo
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, true);
                      }}
                      disabled={logoBlackUploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gold file:text-black
                        hover:file:bg-gold-light
                        file:cursor-pointer
                        disabled:opacity-50"
                    />
                    {logoBlackUploading && (
                      <p className="text-sm text-gold mt-2">Uploading...</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Max 5MB • PNG, JPEG, SVG</p>
                  </label>
                )}
              </div>

              {/* White Logo */}
              <div>
                <label className="block text-gray-300 font-semibold mb-3">Logo for Dark Backgrounds (White)</label>
                {logoWhite ? (
                  <div className="space-y-3">
                    <div className="bg-black p-4 rounded-lg">
                      <img src={logoWhite} alt="White Logo" className="h-20 object-contain" />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLogo(false)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold"
                    >
                      Remove White Logo
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file, false);
                      }}
                      disabled={logoWhiteUploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gold file:text-black
                        hover:file:bg-gold-light
                        file:cursor-pointer
                        disabled:opacity-50"
                    />
                    {logoWhiteUploading && (
                      <p className="text-sm text-gold mt-2">Uploading...</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Max 5MB • PNG, JPEG, SVG</p>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Visibility Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-6">Navigation Menu</h2>
            <p className="text-gray-400 mb-6">Toggle which sections appear in the main navigation menu:</p>

            <div className="space-y-4">
              {[
                { id: 'about', label: 'About Us', state: showAbout, setState: setShowAbout },
                { id: 'tours', label: 'Tours & Events', state: showTours, setState: setShowTours },
                { id: 'merch', label: 'Merchandise', state: showMerch, setState: setShowMerch },
                { id: 'videos', label: 'Videos', state: showVideos, setState: setShowVideos },
                { id: 'contact', label: 'Contact', state: showContact, setState: setShowContact },
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.state}
                    onChange={(e) => item.setState(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600"
                  />
                  <span className="text-gray-300 font-medium">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Fonts Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-6">Fonts</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 font-semibold mb-2">Display Font (Headers)</label>
                <select
                  value={displayFont}
                  onChange={(e) => setDisplayFont(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                >
                  {googleFonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <p
                  className="text-gold mt-3 text-xl font-bold"
                  style={{ fontFamily: displayFont }}
                >
                  Preview: Tarana
                </p>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-2">Body Font (Text)</label>
                <select
                  value={bodyFont}
                  onChange={(e) => setBodyFont(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                >
                  {googleFonts.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
                <p
                  className="text-gray-300 mt-3"
                  style={{ fontFamily: bodyFont }}
                >
                  Preview: Lorem ipsum dolor sit
                </p>
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-6">Social Media Links</h2>

            {/* Existing Social Links */}
            {socialLinks.length > 0 && (
              <div className="mb-6 space-y-3">
                {socialLinks.map((link, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{link.platform}</p>
                      <p className="text-gray-400 text-sm truncate">{link.url}</p>
                    </div>
                    <button
                      onClick={() => removeSocialLink(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Social Link */}
            <div className="bg-gray-700 p-4 rounded-lg space-y-3">
              <p className="text-gray-300 font-semibold text-sm">Add New Social Link</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Platform (e.g., Instagram, YouTube, Spotify)"
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                  className="p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-gold focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  className="p-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-gold focus:outline-none"
                />
              </div>
              <button
                onClick={addSocialLink}
                className="w-full bg-gold hover:bg-gold-light text-black px-4 py-2 rounded-lg font-semibold"
              >
                Add Social Link
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-0 bg-gray-900 p-4 rounded-lg mt-8">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="w-full px-8 py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-light disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
