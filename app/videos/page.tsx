'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoCategory {
  id: string;
  name: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_file_url: string;
  thumbnail_url: string | null;
  video_type: 'self_hosted' | 'youtube' | 'vimeo' | 'drive';
  is_featured: boolean;
  order_position: number;
  category_id: string | null;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('video_categories')
          .select('*')
          .order('name', { ascending: true });

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          setCategories([]);
        } else {
          setCategories(categoriesData || []);
          // Set first category as default
          if (categoriesData && categoriesData.length > 0) {
            setSelectedCategory(categoriesData[0]);
          }
        }

        // Fetch videos
        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .order('order_position', { ascending: true });

        if (videosError) {
          console.error('Error fetching videos:', videosError);
          setVideos([]);
        } else {
          console.log('Videos fetched successfully:', videosData);
          setVideos(videosData || []);
        }
      } catch (error) {
        console.error('Error:', error);
        setVideos([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  function getVideoEmbedUrl(video: Video): string {
    try {
      if (video.video_type === 'youtube') {
        const videoId = video.video_file_url.includes('youtube.com')
          ? new URL(video.video_file_url).searchParams.get('v')
          : video.video_file_url;
        if (!videoId) throw new Error('Invalid YouTube URL');
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
      if (video.video_type === 'vimeo') {
        const videoId = video.video_file_url.split('/').pop();
        if (!videoId) throw new Error('Invalid Vimeo URL');
        return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
      }
      if (video.video_type === 'drive') {
        let driveFileId = '';
        // Extract file ID from various Google Drive URL formats
        if (video.video_file_url.includes('drive.google.com/file/d/')) {
          driveFileId = video.video_file_url.split('/d/')[1].split('/')[0];
        } else if (video.video_file_url.includes('?id=')) {
          driveFileId = new URL(video.video_file_url).searchParams.get('id') || '';
        } else {
          // Assume it's just the file ID
          driveFileId = video.video_file_url;
        }
        if (!driveFileId) throw new Error('Invalid Google Drive URL');
        return `https://drive.google.com/file/d/${driveFileId}/preview`;
      }
      return video.video_file_url;
    } catch (error) {
      console.error('Error generating video embed URL:', error, video);
      return '';
    }
  }

  function getYouTubeThumbnail(video: Video): string | null {
    if (video.video_type !== 'youtube') return null;
    try {
      const videoId = video.video_file_url.includes('youtube.com')
        ? new URL(video.video_file_url).searchParams.get('v')
        : video.video_file_url;
      if (!videoId) return null;
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } catch {
      return null;
    }
  }

  return (
    <main>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-10 sm:py-12">
        <div className="container-custom">
          <h1 className="heading-display mb-4" style={{ color: 'var(--secondary)' }}>VIDEOS</h1>
          <p className="text-lg sm:text-xl text-gray-300">
            Watch Tarana's latest performances, music videos, and behind-the-scenes content.
          </p>
        </div>
      </section>

      {/* Videos Section */}
      {loading ? (
        <section className="py-10 sm:py-12 bg-black">
          <div className="container-custom text-center">
            <p className="text-gray-300">Loading videos...</p>
          </div>
        </section>
      ) : categories.length === 0 ? (
        <section className="py-10 sm:py-12 bg-black">
          <div className="container-custom text-center">
            <p className="text-gray-300 text-lg">
              No video categories available yet.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Category Filter */}
          <section className="py-8 bg-black border-b border-gray-800">
            <div className="container-custom">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedVideo(null);
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                      selectedCategory?.id === cat.id
                        ? 'bg-white text-black'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                    style={selectedCategory?.id === cat.id ? { backgroundColor: 'var(--secondary)', color: 'var(--primary)' } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {selectedCategory && (() => {
            const categoryVideos = videos.filter(v => v.category_id === selectedCategory.id);
            const featuredVideo = categoryVideos.find(v => v.is_featured) || categoryVideos[0];
            const allVideos = categoryVideos.filter(v => v.id !== featuredVideo?.id);

            return (
              <>
                {/* Featured Video */}
                {featuredVideo ? (
                  <section className="py-12 bg-black text-white">
                    <div className="container-custom">
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
                        {featuredVideo.video_type === 'self_hosted' ? (
                          <video
                            src={featuredVideo.video_file_url}
                            controls
                            autoPlay
                            className="w-full h-full"
                            onError={(e) => console.error('Video playback error:', e)}
                          />
                        ) : (
                          (() => {
                            const embedUrl = getVideoEmbedUrl(featuredVideo);
                            if (!embedUrl) {
                              return (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                  <p className="text-red-400">Error loading video. Invalid URL.</p>
                                </div>
                              );
                            }
                            return (
                              <iframe
                                src={embedUrl}
                                title={featuredVideo.title}
                                className="w-full h-full"
                                frameBorder="0"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              />
                            );
                          })()
                        )}
                      </div>
                      <h2 className="heading-lg mb-4">{featuredVideo.title}</h2>
                      <p className="text-gray-300">{featuredVideo.description}</p>
                    </div>
                  </section>
                ) : null}

                {/* Video Grid */}
                <section className="py-10 sm:py-12 bg-black">
                  <div className="container-custom">
                    <h3 className="heading-md mb-12 text-white">All Videos</h3>
                    {(() => {
                      console.log('=== VIDEO DEBUG ===');
                      console.log('Total videos:', videos.length);
                      console.log('Category videos:', categoryVideos.length);
                      console.log('All videos (excluding featured):', allVideos.length);
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {allVideos.length > 0 ? (
                            allVideos.map((video) => (
                              <button
                                key={video.id}
                                onClick={() => {
                                  console.log('Clicked video:', video);
                                  setSelectedVideo(video);
                                }}
                                className={`group rounded-lg overflow-hidden text-left transition-all bg-white ${
                                  selectedVideo?.id === video.id
                                    ? 'ring-2'
                                    : 'hover:shadow-lg'
                                }`}
                                style={selectedVideo?.id === video.id ? { borderColor: 'var(--accent)', boxShadow: `0 0 0 2px var(--accent)` } : undefined}
                              >
                                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                  {(() => {
                                    const thumbnailUrl = video.thumbnail_url || getYouTubeThumbnail(video);
                                    if (thumbnailUrl) {
                                      return (
                                        <>
                                          <img
                                            src={thumbnailUrl}
                                            alt={video.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            onError={(e) => {
                                              console.error('Image load error for:', video.title, thumbnailUrl);
                                              (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                          />
                                        </>
                                      );
                                    }
                                    return (
                                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-300">
                                        <svg
                                          className="w-16 h-16 text-gray-600"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                        </svg>
                                        <p className="text-xs text-gray-600 mt-2">{video.video_type}</p>
                                      </div>
                                    );
                                  })()}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                    <svg
                                      className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="p-4 bg-white">
                                  <h4 className="font-semibold text-gray-900 transition-colors group-hover-secondary">
                                    {video.title}
                                  </h4>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8">
                              <p className="text-gray-400">No additional videos in this category</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </section>
              </>
            );
          })()}
        </>
      )}

      <Footer />
    </main>
  );
}
