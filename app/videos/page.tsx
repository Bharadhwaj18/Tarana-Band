'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Video {
  id: string;
  title: string;
  description: string;
  video_file_url: string;
  thumbnail_url: string | null;
  video_type: 'self_hosted' | 'youtube' | 'vimeo' | 'drive';
  is_featured: boolean;
  order_position: number;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .order('order_position', { ascending: true });

        if (error) {
          console.error('Error fetching videos:', error);
          setVideos([]);
        } else {
          console.log('Videos fetched successfully:', data);
          setVideos(data || []);
          if (data && data.length > 0) {
            console.log('Setting selected video:', data[0]);
            setSelectedVideo(data[0]);
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
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
      ) : videos.length > 0 ? (
        <>
          {/* Featured Video */}
          {selectedVideo && (
            <section className="py-12 bg-black text-white">
              <div className="container-custom">
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
                  {selectedVideo.video_type === 'self_hosted' ? (
                    <video
                      src={selectedVideo.video_file_url}
                      controls
                      autoPlay
                      className="w-full h-full"
                      onError={(e) => console.error('Video playback error:', e)}
                    />
                  ) : (
                    (() => {
                      const embedUrl = getVideoEmbedUrl(selectedVideo);
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
                          title={selectedVideo.title}
                          className="w-full h-full"
                          frameBorder="0"
                          autoPlay
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      );
                    })()
                  )}
                </div>
                <h2 className="heading-lg mb-4">{selectedVideo.title}</h2>
                <p className="text-gray-300">{selectedVideo.description}</p>
              </div>
            </section>
          )}

          {/* Video Grid */}
          <section className="py-10 sm:py-12 bg-black">
            <div className="container-custom">
              <h3 className="heading-md mb-12 text-white">All Videos</h3>
              {(() => {
                const filteredVideos = videos.filter((video) => video.id !== selectedVideo?.id);
                console.log('=== VIDEO DEBUG ===');
                console.log('Total videos:', videos.length);
                console.log('All videos:', videos);
                console.log('Selected video ID:', selectedVideo?.id);
                console.log('Filtered videos:', filteredVideos);
                console.log('Filtered count:', filteredVideos.length);
                filteredVideos.forEach((v, i) => {
                  console.log(`Video ${i}:`, { id: v.id, title: v.title, type: v.video_type, thumbnail: v.thumbnail_url });
                });
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.length > 0 ? (
                      filteredVideos.map((video) => (
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
                        <p className="text-gray-400">No additional videos</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </section>
        </>
      ) : (
        <section className="py-10 sm:py-12 bg-black">
          <div className="container-custom text-center">
            <p className="text-gray-300 text-lg">
              Videos coming soon. Check back later!
            </p>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
