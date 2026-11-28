'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import VideoModal from '@/components/VideoModal';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

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

const VIDEOS_PER_PAGE = 6;

function getYouTubeId(video: Video): string | null {
  if (video.video_type !== 'youtube') return null;
  try {
    if (video.video_file_url.includes('youtube.com')) return new URL(video.video_file_url).searchParams.get('v');
    if (video.video_file_url.includes('youtu.be/')) return video.video_file_url.split('youtu.be/')[1].split(/[?&]/)[0];
    return video.video_file_url;
  } catch {
    return null;
  }
}

function getVideoEmbedUrl(video: Video): string {
  try {
    if (video.video_type === 'youtube') {
      const videoId = getYouTubeId(video);
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
      if (video.video_file_url.includes('drive.google.com/file/d/')) {
        driveFileId = video.video_file_url.split('/d/')[1].split('/')[0];
      } else if (video.video_file_url.includes('?id=')) {
        driveFileId = new URL(video.video_file_url).searchParams.get('id') || '';
      } else {
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

function getThumbnail(video: Video): string | null {
  if (video.thumbnail_url) return video.thumbnail_url;
  const id = getYouTubeId(video);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
}

// "Aandhi | Tarana (Official Music Video)" -> { name: "Aandhi", kind: "Official Music Video" }
function splitTitle(title: string) {
  const [first, ...rest] = title.split('|').map((part) => part.trim());
  const remainder = rest.join(' ').replace(/^Tarana\s*/i, '').replace(/[()]/g, '').replace(/^\|\s*/, '').trim();
  return { name: first, kind: remainder };
}

function Thumb({ video, className = '' }: { video: Video; className?: string }) {
  const thumbnail = getThumbnail(video);
  const youtubeId = getYouTubeId(video);
  if (!thumbnail) {
    return (
      <div className={`bg-poster flex items-end p-4 ${className}`}>
        <span className="font-poster uppercase text-white text-2xl leading-none">{splitTitle(video.title).name}</span>
      </div>
    );
  }
  return (
    <img
      src={thumbnail}
      alt=""
      loading="lazy"
      className={`object-cover ${className}`}
      onError={(e) => {
        // Not every YouTube video has a max-resolution thumbnail
        const img = e.currentTarget;
        const fallback = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '';
        if (fallback && img.src !== fallback) img.src = fallback;
      }}
    />
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<{ [categoryId: string]: number }>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const [{ data: categoriesData }, { data: videosData }] = await Promise.all([
          supabase.from('video_categories').select('*').order('order_position', { ascending: true }),
          supabase.from('videos').select('*').order('order_position', { ascending: true }).order('created_at', { ascending: true }),
        ]);
        setCategories(categoriesData || []);
        setVideos(videosData || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openVideo = (video: Video) => {
    setSelectedVideo(video);
    trackEvent('video_play', { video_title: video.title, video_type: video.video_type });
  };

  const categoriesWithVideos = categories.filter((category) => videos.some((v) => v.category_id === category.id));
  const visibleCategories =
    activeCategory === 'all' ? categoriesWithVideos : categoriesWithVideos.filter((c) => c.id === activeCategory);

  const firstCategoryVideo = categoriesWithVideos.length
    ? videos.find((v) => v.category_id === categoriesWithVideos[0].id)
    : undefined;
  const featured = videos.find((v) => v.is_featured) || firstCategoryVideo || videos[0];
  const featuredTitle = featured ? splitTitle(featured.title) : null;

  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="gp-container pt-12 sm:pt-14 pb-8 flex flex-wrap justify-between items-end gap-6">
        <div>
          <p className="gp-mono text-sm uppercase mb-3">Music videos · covers · live</p>
          <h1 className="gp-display text-[clamp(72px,13vw,200px)] leading-[0.82]">
            Watch<span className="text-poster">.</span>
          </h1>
        </div>
        {categoriesWithVideos.length > 1 && (
          <div role="tablist" aria-label="Video categories" className="flex flex-wrap border-[3px] border-ink">
            {[{ id: 'all', name: 'All' }, ...categoriesWithVideos].map((category, index, all) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`min-h-[52px] px-5 gp-mono font-bold text-sm uppercase ${
                  index < all.length - 1 ? 'border-r-[3px] border-ink' : ''
                } ${activeCategory === category.id ? 'bg-ink text-paper' : 'bg-paper hover:bg-white'}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {loading ? (
        <p className="gp-container gp-mono py-16">Loading videos…</p>
      ) : !featured ? (
        <p className="gp-container gp-mono py-16">No videos yet. Check back soon.</p>
      ) : (
        <>
          {activeCategory === 'all' && featuredTitle && (
            <section className="gp-container pt-4 pb-16 sm:pb-20 flex flex-wrap gap-10 items-stretch">
              <button
                type="button"
                onClick={() => openVideo(featured)}
                aria-label={`Play ${featured.title}`}
                className="flex-[999_1_620px] min-w-0 relative block bg-ink border-[3px] border-ink shadow-hard-red group text-left"
              >
                <Thumb video={featured} className="w-full aspect-video block" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center bg-poster text-white border-[3px] border-ink group-hover:scale-110 transition-transform">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M6 3l15 9-15 9z" />
                  </svg>
                </span>
              </button>
              <div className="flex-[1_1_340px] min-w-0 flex flex-col gap-4">
                <span className="self-start bg-ink text-paper gp-mono text-xs font-bold uppercase px-2.5 py-1.5">
                  Featured{featuredTitle.kind ? ` · ${featuredTitle.kind}` : ''}
                </span>
                <h2 className="gp-display text-6xl sm:text-[72px]">{featuredTitle.name}</h2>
                {featured.description && (
                  <p className="text-[17px] leading-relaxed line-clamp-6 whitespace-pre-line">{featured.description}</p>
                )}
                <button type="button" onClick={() => openVideo(featured)} className="gp-btn gp-btn-ink self-start mt-auto">
                  ▶ Play video
                </button>
              </div>
            </section>
          )}

          <div className="gp-container pb-20 sm:pb-24 space-y-16">
            {visibleCategories.map((category) => {
              const categoryVideos = videos.filter((v) => v.category_id === category.id);
              const page = currentPage[category.id] || 0;
              const totalPages = Math.ceil(categoryVideos.length / VIDEOS_PER_PAGE);
              const pageVideos = categoryVideos.slice(page * VIDEOS_PER_PAGE, (page + 1) * VIDEOS_PER_PAGE);

              return (
                <section key={category.id} aria-label={category.name}>
                  <div className="flex flex-wrap justify-between items-center gap-4 pb-3 mb-6 border-b-[3px] border-ink">
                    <h2 className="font-poster uppercase text-3xl sm:text-[44px] leading-none">{category.name}</h2>
                    <div className="flex items-center gap-3">
                      {totalPages > 1 && (
                        <>
                          <button
                            type="button"
                            disabled={page === 0}
                            onClick={() => setCurrentPage((prev) => ({ ...prev, [category.id]: page - 1 }))}
                            aria-label={`Previous ${category.name}`}
                            className="w-11 h-11 border-[3px] border-ink font-bold disabled:opacity-30"
                          >
                            ←
                          </button>
                          <span className="gp-mono text-sm">
                            {page + 1}/{totalPages}
                          </span>
                          <button
                            type="button"
                            disabled={page >= totalPages - 1}
                            onClick={() => setCurrentPage((prev) => ({ ...prev, [category.id]: page + 1 }))}
                            aria-label={`Next ${category.name}`}
                            className="w-11 h-11 bg-ink text-paper font-bold disabled:opacity-30"
                          >
                            →
                          </button>
                        </>
                      )}
                      {category.show_more_link && (
                        <a
                          href={category.show_more_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="gp-mono text-sm font-bold underline underline-offset-4 hover:text-poster-dark"
                        >
                          Show all ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
                    {pageVideos.map((video) => {
                      const { name, kind } = splitTitle(video.title);
                      return (
                        <button
                          key={video.id}
                          type="button"
                          onClick={() => openVideo(video)}
                          className="text-left group"
                          title={video.title}
                        >
                          <div className="relative border-[3px] border-ink bg-ink overflow-hidden">
                            <Thumb video={video} className="w-full aspect-video block group-hover:scale-105 transition-transform duration-300" />
                            <span className="absolute left-0 bottom-0 bg-poster text-white gp-mono text-xs font-bold px-2.5 py-1.5">
                              ▶ PLAY
                            </span>
                          </div>
                          <div className="mt-3 font-poster uppercase text-[22px] leading-tight group-hover:text-poster-dark">
                            {name}
                          </div>
                          {kind && <div className="gp-mono text-[13px] mt-0.5">{kind}</div>}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </>
      )}

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
