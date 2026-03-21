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
  video_type: 'self_hosted' | 'youtube' | 'vimeo';
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
        } else {
          setVideos(data || []);
          if (data && data.length > 0) {
            setSelectedVideo(data[0]);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  function getVideoEmbedUrl(video: Video): string {
    if (video.video_type === 'youtube') {
      const videoId = video.video_file_url.includes('youtube.com')
        ? new URL(video.video_file_url).searchParams.get('v')
        : video.video_file_url;
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (video.video_type === 'vimeo') {
      const videoId = video.video_file_url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return video.video_file_url;
  }

  return (
    <main>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-16 sm:py-24">
        <div className="container-custom">
          <h1 className="heading-display mb-4 text-red-600">VIDEOS</h1>
          <p className="text-lg sm:text-xl text-gray-300">
            Watch Tarana's latest performances, music videos, and behind-the-scenes content.
          </p>
        </div>
      </section>

      {/* Videos Section */}
      {loading ? (
        <section className="py-16 sm:py-24 bg-white">
          <div className="container-custom text-center">
            <p className="text-gray-600">Loading videos...</p>
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
                      className="w-full h-full"
                    />
                  ) : (
                    <iframe
                      src={getVideoEmbedUrl(selectedVideo)}
                      title={selectedVideo.title}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  )}
                </div>
                <h2 className="heading-lg mb-4">{selectedVideo.title}</h2>
                <p className="text-gray-300">{selectedVideo.description}</p>
              </div>
            </section>
          )}

          {/* Video Grid */}
          <section className="py-16 sm:py-24 bg-white">
            <div className="container-custom">
              <h3 className="heading-md mb-12">All Videos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => setSelectedVideo(video)}
                    className={`group rounded-lg overflow-hidden text-left transition-all ${
                      selectedVideo?.id === video.id
                        ? 'ring-2 ring-red-600'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          <svg
                            className="w-16 h-16 text-gray-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                      )}
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
                    <div className="p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                        {video.title}
                      </h4>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="py-16 sm:py-24 bg-white">
          <div className="container-custom text-center">
            <p className="text-gray-600 text-lg">
              Videos coming soon. Check back later!
            </p>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
