'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/AdminLayout';

interface GalleryPhoto {
  id: string;
  title: string | null;
  image_url: string;
}

interface FeaturedPhoto {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  order: number;
}

export default function AdminHomepagePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Hero
  const [heroTitle, setHeroTitle] = useState('TARANA');
  const [heroSubtitle, setHeroSubtitle] = useState('Experience the raw energy of live rock music');
  const [heroBgImage, setHeroBgImage] = useState('');
  const [heroBgVideo, setHeroBgVideo] = useState('');
  const [heroVideoStorage, setHeroVideoStorage] = useState('');
  const [heroVideoUploading, setHeroVideoUploading] = useState(false);
  const [heroCtaText, setHeroCtaText] = useState('View Tours');
  const [heroCtaLink, setHeroCtaLink] = useState('/tours');

  // Stats
  const [showsPlayed, setShowsPlayed] = useState(0);
  const [fans, setFans] = useState(0);
  const [yearsActive, setYearsActive] = useState(0);
  const [albums, setAlbums] = useState(0);

  // Music Embed
  const [musicType, setMusicType] = useState<'spotify' | 'youtube'>('spotify');
  const [musicEmbedUrl, setMusicEmbedUrl] = useState('');
  const [musicTitle, setMusicTitle] = useState('Latest Music');
  const [musicDescription, setMusicDescription] = useState('');

  // Featured Photos
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [featuredPhotos, setFeaturedPhotos] = useState<FeaturedPhoto[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
      await fetchGalleryPhotos();
    };
    checkAuth();
  }, [router]);

  const fetchGalleryPhotos = async () => {
    if (!supabase) return;
    try {
      const { data } = await supabase
        .from('gallery_photos')
        .select('id, title, image_url')
        .order('order_position', { ascending: true });

      if (data) {
        setGalleryPhotos(data);
      }
    } catch (error) {
      console.error('Error fetching gallery photos:', error);
    }
  };

  const fetchConfig = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('general_config')
        .select('*')
        .eq('is_active', true);


      if (data) {
        data.forEach((item: any) => {
          const content = item.content;
          switch (item.section_name) {
            case 'hero':
              setHeroTitle(content.title || 'TARANA');
              setHeroSubtitle(content.subtitle || 'Experience the raw energy of live rock music');
              setHeroBgImage(content.background_image || '');
              setHeroBgVideo(content.background_video || '');
              setHeroVideoStorage(content.video_storage_path || '');
              setHeroCtaText(content.cta_text || 'View Tours');
              setHeroCtaLink(content.cta_link || '/tours');
              break;
            case 'stats':
              setShowsPlayed(content.shows_played ?? 0);
              setFans(content.fans ?? 0);
              setYearsActive(content.years_active ?? 0);
              setAlbums(content.albums ?? 0);
              break;
            case 'music_embed':
              setMusicType(content.type || 'spotify');
              setMusicEmbedUrl(content.embed_url || '');
              setMusicTitle(content.title || 'Latest Music');
              setMusicDescription(content.description || '');
              break;
            case 'featured_photos':
              if (content.photos) {
                setFeaturedPhotos(content.photos.map((photo: any, index: number) => ({
                  ...photo,
                  order: index
                })));
              }
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

  const addToFeatured = (photo: GalleryPhoto) => {
    if (featuredPhotos.some(fp => fp.id === photo.id)) {
      setMessage('Photo already featured');
      return;
    }

    const newFeatured: FeaturedPhoto = {
      id: photo.id,
      title: photo.title,
      subtitle: null,
      image_url: photo.image_url,
      order: featuredPhotos.length
    };

    setFeaturedPhotos([...featuredPhotos, newFeatured]);
  };

  const removeFromFeatured = (photoId: string) => {
    const updated = featuredPhotos
      .filter(fp => fp.id !== photoId)
      .map((fp, index) => ({ ...fp, order: index }));
    setFeaturedPhotos(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedPhotos = [...featuredPhotos];
    const draggedPhoto = updatedPhotos[draggedIndex];

    // Remove dragged item
    updatedPhotos.splice(draggedIndex, 1);

    // Insert at new position
    updatedPhotos.splice(dropIndex, 0, draggedPhoto);

    // Update order numbers
    const reorderedPhotos = updatedPhotos.map((photo, index) => ({
      ...photo,
      order: index
    }));

    setFeaturedPhotos(reorderedPhotos);
    setDraggedIndex(null);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setMessage('Error: Video file too large. Maximum 50MB allowed.');
      return;
    }

    setHeroVideoUploading(true);
    setMessage('Uploading video...');

    try {
      // Delete the old video first — overwriting existing files triggers RLS errors
      if (heroVideoStorage) {
        await supabase.storage.from('photos').remove([heroVideoStorage]);
      }

      // Unique timestamped path so every upload is a fresh INSERT
      const fileExt = file.name.split('.').pop() || 'mp4';
      const filePath = `hero-video/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) throw new Error(error.message);

      const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      setHeroBgVideo(urlData.publicUrl);
      setHeroVideoStorage(filePath);
      setMessage('✓ Video uploaded successfully!');
    } catch (error: any) {
      setMessage(`Error: ${error?.message || 'Upload failed'}`);
    }

    setHeroVideoUploading(false);
  };

  const removeVideo = () => {
    setHeroBgVideo('');
    setHeroVideoStorage('');
  };

  const saveConfig = async () => {
    if (!supabase) return;
    setSaving(true);
    setMessage('');

    try {
      const sections = [
        {
          section_name: 'hero',
          content: {
            title: heroTitle,
            subtitle: heroSubtitle,
            background_image: heroBgImage,
            background_video: heroBgVideo,
            video_storage_path: heroVideoStorage,
            cta_text: heroCtaText,
            cta_link: heroCtaLink,
          },
        },
        {
          section_name: 'stats',
          content: {
            shows_played: showsPlayed,
            fans: fans,
            years_active: yearsActive,
            albums: albums,
          },
        },
        {
          section_name: 'music_embed',
          content: {
            type: musicType,
            embed_url: musicEmbedUrl,
            title: musicTitle,
            description: musicDescription,
          },
        },
        {
          section_name: 'featured_photos',
          content: {
            photos: featuredPhotos.sort((a, b) => a.order - b.order)
          },
        },
      ];


      for (const section of sections) {
        const result = await supabase
          .from('general_config')
          .upsert({
            ...section,
            is_active: true,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'section_name'
          });
      }

      setMessage('Homepage updated successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Error updating homepage');
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
      <div className="max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-4xl font-bold text-gold">Edit Homepage</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 text-center"
            >
              Preview Website
            </a>
            <button
              onClick={saveConfig}
              disabled={saving}
              className="px-8 py-3 bg-gold text-black font-bold rounded-lg hover:bg-gold-light disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-4">Hero Section</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Background Image URL</label>
                <input
                  type="text"
                  value={heroBgImage}
                  onChange={(e) => setHeroBgImage(e.target.value)}
                  placeholder="Optional background image URL"
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Background Video</label>
                {heroBgVideo ? (
                  <div className="space-y-2">
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-sm text-gray-300 truncate">✓ Video uploaded</p>
                      <video
                        src={heroBgVideo}
                        className="w-full h-24 mt-2 rounded object-cover"
                        muted
                        playsInline
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      Remove Video
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={heroVideoUploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gold file:text-black
                        hover:file:bg-gold-light
                        file:cursor-pointer
                        disabled:opacity-50"
                    />
                    {heroVideoUploading && (
                      <p className="text-sm text-gold mt-2">Uploading video...</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Max 50MB • Landscape orientation • MP4, WebM recommended</p>
                  </label>
                )}
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Call-to-Action Link</label>
                <input
                  type="text"
                  value={heroCtaLink}
                  onChange={(e) => setHeroCtaLink(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-4">Stats Section</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Shows Played</label>
                <input
                  type="number"
                  value={showsPlayed}
                  onChange={(e) => setShowsPlayed(Number(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Streams Across Platforms</label>
                <input
                  type="number"
                  value={fans}
                  onChange={(e) => setFans(Number(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Years Active</label>
                <input
                  type="number"
                  value={yearsActive}
                  onChange={(e) => setYearsActive(Number(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Albums</label>
                <input
                  type="number"
                  value={albums}
                  onChange={(e) => setAlbums(Number(e.target.value))}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Music Embed Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-4">Music Embed</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Platform</label>
                <select
                  value={musicType}
                  onChange={(e) => setMusicType(e.target.value as 'spotify' | 'youtube')}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                >
                  <option value="spotify">Spotify</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Embed URL or Code</label>
                <textarea
                  value={musicEmbedUrl}
                  onChange={(e) => {
                    const input = e.target.value;
                    // Extract src from full iframe code if pasted
                    const srcMatch = input.match(/src=["']([^"']+)["']/);
                    if (srcMatch && srcMatch[1]) {
                      setMusicEmbedUrl(srcMatch[1]);
                    } else {
                      setMusicEmbedUrl(input);
                    }
                  }}
                  placeholder="Paste Spotify/YouTube embed URL or full embed code here"
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Tip: Paste the full embed code or just the URL - we'll extract it automatically</p>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Section Title</label>
                <input
                  type="text"
                  value={musicTitle}
                  onChange={(e) => setMusicTitle(e.target.value)}
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Description (Right Side Text)</label>
                <textarea
                  value={musicDescription}
                  onChange={(e) => setMusicDescription(e.target.value)}
                  placeholder="Tell your audience about this music embed. This will appear on the right side next to the embed."
                  className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-gold focus:outline-none resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Featured Photos Section */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gold mb-4">Featured Photos Carousel</h2>
            <p className="text-gray-400 mb-4">
              Create a stunning full-width carousel for your homepage. Add any number of photos and drag to reorder them.
              Photos auto-advance every 5 seconds with navigation controls.
            </p>

            {/* Current Featured Photos */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">
                Carousel Photos ({featuredPhotos.length}) - Drag to Reorder
              </h3>
              {featuredPhotos.length === 0 ? (
                <p className="text-gray-400">No photos selected. Choose from gallery below to create your carousel.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPhotos
                    .sort((a, b) => a.order - b.order)
                    .map((photo, index) => (
                      <div
                        key={photo.id}
                        className="relative bg-gray-700 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-gold/20 transition-all"
                      >
                        <div
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className="cursor-move"
                        >
                          <img
                            src={photo.image_url}
                            alt={photo.title || 'Featured photo'}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                        <div className="p-3 space-y-2">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">
                              Photo {index + 1} - Subtitle
                            </label>
                            <input
                              type="text"
                              value={photo.subtitle || ''}
                              onChange={(e) => {
                                const updated = featuredPhotos.map((fp, i) =>
                                  i === index ? { ...fp, subtitle: e.target.value } : fp
                                );
                                setFeaturedPhotos(updated);
                              }}
                              placeholder="Add a subtitle for this carousel image..."
                              className="w-full px-2 py-1 bg-gray-600 text-white text-xs rounded border border-gray-500 focus:border-gold focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => removeFromFeatured(photo.id)}
                            className="w-full px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            Remove from Carousel
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Gallery Photos Selection */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Add Photos to Carousel</h3>
              <p className="text-gray-400 text-sm mb-3">
                Click any gallery photo to add it to your homepage carousel. No limits - add as many as you want!
              </p>
              {galleryPhotos.length === 0 ? (
                <div className="text-center py-8 bg-gray-700 rounded-lg">
                  <p className="text-gray-400">No photos in gallery.</p>
                  <a
                    href="/admin/gallery"
                    className="text-gold hover:text-gold-light underline"
                  >
                    Upload photos to gallery first
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 max-h-96 overflow-y-auto bg-gray-700 p-4 rounded-lg">
                  {galleryPhotos.map((photo) => {
                    const isSelected = featuredPhotos.some(fp => fp.id === photo.id);
                    return (
                      <div
                        key={photo.id}
                        className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-gold opacity-50'
                            : 'hover:ring-2 hover:ring-gold-light'
                        }`}
                        onClick={() => !isSelected && addToFeatured(photo)}
                      >
                        <img
                          src={photo.image_url}
                          alt={photo.title || 'Gallery photo'}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-white text-xs truncate">
                              {photo.title || 'Untitled'}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                            <span className="text-gold font-bold">✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}