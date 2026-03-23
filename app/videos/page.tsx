'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VideoModal from '@/components/VideoModal';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface VideoCategory {
  id: string;
  name: string;
  order_position?: number;
  show_more_link?: string;
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
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<{ [categoryId: string]: number }>({});
  const videosPerPage = 6;

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        // Fetch categories ordered by position
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('video_categories')
          .select('*')
          .order('order_position', { ascending: true });

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          setCategories([]);
        } else {
          setCategories(categoriesData || []);
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
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`;
      }
      if (video.video_type === 'vimeo') {
        const videoId = video.video_file_url.split('/').pop();
        if (!videoId) throw new Error('Invalid Vimeo URL');
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&controls=1`;
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
        return `https://drive.google.com/file/d/${driveFileId}/preview?usp=drivesdk`;
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

      {/* Videos Section - Netflix Style */}
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
        <section className="py-10 sm:py-12 bg-black space-y-12">
          {categories.map((category) => {
            const categoryVideos = videos.filter(v => v.category_id === category.id);
            if (categoryVideos.length === 0) return null;

            const page = currentPage[category.id] || 0;
            const startIndex = page * videosPerPage;
            const endIndex = startIndex + videosPerPage;
            const visibleVideos = categoryVideos.slice(startIndex, endIndex);
            const totalPages = Math.ceil(categoryVideos.length / videosPerPage);
            const hasNextPage = page < totalPages - 1;
            const hasPrevPage = page > 0;

            return (
              <div key={category.id} className="container-custom">
                {/* Category Title with Arrows and Show More */}
                <div className="flex items-center gap-4 mb-6 justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{category.name}</h2>

                    {/* Navigation Arrows */}
                    <div className="flex gap-2">
                      {hasPrevPage && (
                        <button
                          onClick={() => setCurrentPage(prev => ({ ...prev, [category.id]: prev[category.id] - 1 }))}
                          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="Previous videos"
                        >
                          <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}

                      {hasNextPage && (
                        <button
                          onClick={() => setCurrentPage(prev => ({ ...prev, [category.id]: prev[category.id] + 1 }))}
                          className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="Next videos"
                        >
                          <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Show More Link */}
                  {category.show_more_link && (
                    <a
                      href={category.show_more_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gold hover:bg-gold-light text-black font-semibold text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <span>Show All</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                </div>

                {/* Videos Container */}
                <div className="mb-6">
                  <div className="flex gap-4 overflow-hidden">
                    {visibleVideos.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => setSelectedVideo(video)}
                        className="flex-shrink-0 group cursor-pointer transition-transform hover:scale-105"
                        style={{ width: '280px' }}
                      >
                        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative">
                          {(() => {
                            const thumbnailUrl = video.thumbnail_url || getYouTubeThumbnail(video);
                            if (thumbnailUrl) {
                              return (
                                <img
                                  src={thumbnailUrl}
                                  alt={video.title}
                                  className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                                  onError={(e) => {
                                    console.error('Image load error:', video.title);
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              );
                            }
                            return (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
                                <svg
                                  className="w-12 h-12 text-gray-500"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                              </div>
                            );
                          })()}
                          {/* Play button overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all">
                            <svg
                              className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                        <div className="mt-3">
                          <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-gray-300 truncate" title={video.title}>
                            {video.title}
                          </h3>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Video Modal */}
      <VideoModal
        video={selectedVideo}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        getVideoEmbedUrl={getVideoEmbedUrl}
      />

      <Footer />
    </main>
  );
}
