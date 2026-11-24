'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Ticker from '@/components/Ticker';
import { useAppConfig } from '@/components/AppConfigProvider';
import { createClient } from '@supabase/supabase-js';
import { getTourStatus } from '@/lib/tours';

interface GalleryPhoto {
  id: string;
  title: string | null;
  subtitle?: string | null;
  image_url: string;
  order: number;
}

interface HomepageConfig {
  hero?: {
    title: string;
    subtitle: string;
    background_image: string;
    background_video?: string;
    video_storage_path?: string;
    cta_text: string;
    cta_link: string;
  };
  stats?: {
    shows_played: number;
    fans: number;
    years_active: number;
    tracks_released?: number;
  };
  featured_photos?: {
    photos: GalleryPhoto[];
  };
  music_embed?: {
    type: 'spotify' | 'youtube';
    embed_url: string;
    title: string;
    description?: string;
  };
}

interface Tour {
  id: string;
  date: string;
  venue_name: string;
  city: string;
  ticket_link: string;
  status: 'upcoming' | 'past' | 'cancelled';
}

interface MerchPreview {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  image_urls?: string[] | null;
  image_positions?: string[] | null;
}

function getOptimizedSupabaseImageUrl(url: string, width: number = 1600, quality: number = 70): string {
  if (!url || !url.includes('/storage/v1/object/public/')) return url;
  const renderUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  const separator = renderUrl.includes('?') ? '&' : '?';
  return `${renderUrl}${separator}width=${width}&quality=${quality}`;
}

function formatShortDate(date: string) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${String(d.getFullYear()).slice(-2)}`;
}

function formatStreams(fans: number) {
  if (fans >= 1000000) return `${Math.floor(fans / 1000000)}M+`;
  if (fans >= 1000) return `${Math.floor(fans / 1000)}K+`;
  return `${fans}+`;
}

const STREAMING_PLATFORMS = ['spotify', 'apple music', 'youtube music'];

export default function Home() {
  const { navConfig, socialConfig } = useAppConfig();
  const [config, setConfig] = useState<HomepageConfig>({});
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextShow, setNextShow] = useState<Tour | null>(null);
  const [lastShow, setLastShow] = useState<Tour | null>(null);
  const [merch, setMerch] = useState<MerchPreview[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [notificationTour, setNotificationTour] = useState<Tour | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return;

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data: homepageData } = await supabase
        .from('general_config')
        .select('*')
        .eq('is_active', true)
        .in('section_name', ['hero', 'stats', 'music_embed', 'featured_photos']);

      if (homepageData) {
        const configData: HomepageConfig = {};
        homepageData.forEach((item: any) => {
          configData[item.section_name as keyof HomepageConfig] = item.content;
        });

        // Keep featured photo URLs in sync with the latest gallery records
        const featured = configData.featured_photos?.photos;
        if (featured && featured.length > 0) {
          const { data: latestGalleryPhotos } = await supabase
            .from('gallery_photos')
            .select('id, image_url')
            .in('id', featured.map((photo) => photo.id));

          if (latestGalleryPhotos && latestGalleryPhotos.length > 0) {
            const urlById = new Map(
              latestGalleryPhotos.map((photo: { id: string; image_url: string }) => [photo.id, photo.image_url])
            );
            configData.featured_photos = {
              photos: featured.map((photo) => ({
                ...photo,
                image_url: urlById.get(photo.id) || photo.image_url,
              })),
            };
          }
        }

        setConfig(configData);
      }

      // Tours: next show for the shows card, plus the pop-up when a show is within 3 months
      const { data: toursData } = await supabase
        .from('tours')
        .select('*')
        .neq('status', 'cancelled')
        .order('date', { ascending: true });

      if (toursData && toursData.length > 0) {
        const upcoming = toursData.filter((tour: Tour) => getTourStatus(tour) === 'upcoming');
        const past = toursData.filter((tour: Tour) => getTourStatus(tour) === 'past');
        setNextShow(upcoming[0] || null);
        setLastShow(past[past.length - 1] || null);

        const threeMonthsFromNow = new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000);
        const soon = upcoming.find((tour: Tour) => new Date(tour.date) <= threeMonthsFromNow);
        if (soon && !sessionStorage.getItem('tour-notification-seen')) {
          setNotificationTour(soon);
          setShowNotification(true);
          sessionStorage.setItem('tour-notification-seen', 'true');
        }
      }

      const { data: merchData } = await supabase
        .from('merchandise')
        .select('id, name, price, image_url, image_urls, image_positions')
        .eq('is_active', true)
        .not('rigly_item_id', 'is', null)
        .order('order_position', { ascending: true })
        .limit(2);
      setMerch(merchData || []);
    };

    fetchData();
  }, []);

  const hero = config.hero || {
    title: 'TARANA',
    subtitle: 'Classical Roots, Rock Energy',
    background_image: '',
    background_video: '',
    cta_text: 'About Us',
    cta_link: '/about',
  };
  const heroCtaText =
    hero.cta_link === '/about' && (!hero.cta_text || hero.cta_text.trim().toLowerCase() === 'view tours')
      ? 'About us'
      : hero.cta_text;
  // Saved stats win; tracks_released falls back to 8 until it's saved from admin
  const stats = { shows_played: 100, fans: 100000, years_active: 3, tracks_released: 8, ...(config.stats || {}) };
  const tracksReleased = stats.tracks_released ?? 8;
  const musicEmbed = config.music_embed;
  const featuredPhotos = [...(config.featured_photos?.photos || [])].sort((a, b) => a.order - b.order);

  // "Classical Roots, Rock Energy" becomes two poster lines with the second in red
  const [subtitleFirst, ...subtitleRest] = (hero.subtitle || '').split(',');
  const subtitleSecond = subtitleRest.join(',').trim();

  const streamingLinks = (socialConfig.social_links || []).filter((link) =>
    STREAMING_PLATFORMS.includes(link.platform.toLowerCase())
  );

  const statItems = [
    { value: `${stats.shows_played}+`, label: 'Shows played', show: stats.shows_played > 0 },
    { value: formatStreams(stats.fans), label: 'Streams across platforms', show: stats.fans > 0 },
    { value: `${stats.years_active}+`, label: 'Years rocking', show: stats.years_active > 0 },
    { value: `${tracksReleased}`, label: 'Tracks released', show: tracksReleased > 0, red: true },
  ].filter((stat) => stat.show);

  // Gallery auto-advances every 5 seconds
  useEffect(() => {
    if (featuredPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredPhotos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredPhotos.length, currentSlide]);

  // Tour pop-up hides itself after 10 seconds
  useEffect(() => {
    if (!showNotification || isClosing) return;
    const hideTimer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => setShowNotification(false), 500);
    }, 10000);
    return () => clearTimeout(hideTimer);
  }, [showNotification, isClosing]);

  const slideCount = featuredPhotos.length;
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % Math.max(1, slideCount));
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slideCount) % Math.max(1, slideCount));
  const peek = (offset: number) => featuredPhotos[(currentSlide + offset) % Math.max(1, slideCount)];
  const current = featuredPhotos[currentSlide];

  const heroImage = hero.background_image || featuredPhotos[0]?.image_url || '';

  return (
    <main className="gp min-h-screen">
      <Navigation />

      {/* Hero */}
      <section className="gp-container pt-10 sm:pt-14 pb-14 sm:pb-16 flex flex-wrap gap-10 items-stretch">
        <div className="flex-[1_1_520px] min-w-0 flex flex-col justify-between gap-8">
          <p className="gp-mono text-sm uppercase">Bengaluru, India — Carnatic × Hindustani × Rock</p>
          <h1 className="gp-display text-[clamp(50px,6.8vw,120px)]">
            <span className="sr-only">{hero.title}: </span>
            {subtitleFirst}
            {subtitleSecond && (
              <>
                .<br />
                <span className="text-poster">{subtitleSecond}.</span>
              </>
            )}
          </h1>
          <div className="flex flex-wrap gap-3">
            {heroCtaText && hero.cta_link && (
              <Link href={hero.cta_link} className="gp-btn gp-btn-ink">
                {heroCtaText}
              </Link>
            )}
            {navConfig.show_tours !== false && hero.cta_link !== '/tours' && (
              <Link href="/tours" className="gp-btn gp-btn-outline">
                Live dates
              </Link>
            )}
          </div>
        </div>

        <div className="flex-[1_1_480px] min-w-0 relative min-h-[420px] sm:min-h-[600px] bg-poster overflow-hidden">
          {hero.background_video ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={hero.background_image || undefined}
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 mix-blend-multiply"
            >
              <source src={hero.background_video} type="video/mp4" />
              <source src={hero.background_video} type="video/webm" />
            </video>
          ) : heroImage ? (
            <img
              src={getOptimizedSupabaseImageUrl(heroImage)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 mix-blend-multiply"
            />
          ) : null}
          {navConfig.show_merch === true && (
            <Link
              href="/merch"
              className="absolute right-3 bottom-8 sm:-right-3 sm:bottom-10 -rotate-6 bg-ink text-paper px-5 py-4 font-poster text-lg sm:text-[22px] leading-[1.05] uppercase shadow-[6px_6px_0_#F1ECE2] hover:rotate-0 transition-transform"
            >
              Merch drop 01
              <br />
              <span className="text-poster-light">out now →</span>
            </Link>
          )}
        </div>
      </section>

      <Ticker words={['Carnatic flute', 'Hindustani vocals', 'Rock', 'Bengaluru']} />

      {/* Stats */}
      {statItems.length > 0 && (
        <section aria-label="Band in numbers" className="gp-container">
          <div className="grid grid-cols-2 lg:grid-cols-4 border-b-[3px] border-ink">
            {statItems.map((stat) => (
              <div
                key={stat.label}
                className="py-8 sm:py-9 px-4 lg:px-6 border-ink [&:nth-child(odd)]:pl-0 lg:[&:nth-child(odd)]:pl-6 lg:first:!pl-0 [&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0"
              >
                <div className={`font-poster text-5xl sm:text-[72px] leading-none ${stat.red ? 'text-poster' : ''}`}>
                  {stat.value}
                </div>
                <div className="gp-mono text-[13px] uppercase mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest music */}
      {musicEmbed && musicEmbed.embed_url && (
        <section className="bg-poster text-white mt-20 sm:mt-24">
          <div className="gp-container py-20 sm:py-24 flex flex-wrap gap-14 items-center">
            <div className="flex-[1_1_520px] min-w-0 border-[3px] border-ink shadow-hard bg-ink">
              <iframe
                src={musicEmbed.embed_url}
                title={musicEmbed.title || 'Latest music'}
                width="100%"
                height="380"
                frameBorder="0"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope"
                allowFullScreen
                className="w-full block"
              />
            </div>
            <div className="flex-[1_1_420px] min-w-0">
              <p className="gp-mono text-sm uppercase mb-4">Now streaming</p>
              <h2 className="gp-display text-[clamp(48px,6.5vw,104px)]">{musicEmbed.title || 'Latest music'}</h2>
              {musicEmbed.description && (
                <p className="mt-6 mb-8 text-lg leading-relaxed max-w-[52ch] whitespace-pre-wrap">
                  {musicEmbed.description}
                </p>
              )}
              {streamingLinks.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {streamingLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gp-btn gp-btn-paper min-h-[48px] px-5"
                    >
                      {link.platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* On stage gallery */}
      {current && (
        <section className="gp-container pt-20 sm:pt-24" aria-roledescription="carousel" aria-label="On stage photos">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <h2 className="gp-display text-[clamp(56px,8vw,120px)]">On stage</h2>
              <p className="gp-mono text-sm mt-2">Live moments that define us</p>
            </div>
            {slideCount > 1 && (
              <div className="flex items-center gap-3">
                <span className="gp-mono text-base font-bold mr-2" aria-live="polite">
                  {String(currentSlide + 1).padStart(2, '0')} / {String(slideCount).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous photo"
                  className="w-14 h-14 border-[3px] border-ink bg-paper text-xl font-bold hover:bg-ink hover:text-paper transition-colors"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next photo"
                  className="w-14 h-14 bg-ink text-paper text-xl font-bold hover:bg-poster transition-colors"
                >
                  →
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr] gap-4">
            <figure className="relative border-[3px] border-ink bg-ink m-0">
              <img
                key={current.id}
                src={getOptimizedSupabaseImageUrl(current.image_url)}
                alt={current.subtitle || 'Tarana performing live'}
                className="w-full h-[56vh] sm:h-[520px] object-cover block"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== current.image_url) img.src = current.image_url;
                }}
              />
              {/* Only the caption written in admin; photo titles are file names like "DSC05671" */}
              {current.subtitle && (
                <figcaption className="absolute left-0 bottom-0 bg-ink text-paper gp-mono text-sm font-bold uppercase px-4 py-2.5 max-w-full">
                  {current.subtitle}
                </figcaption>
              )}
            </figure>
            {slideCount > 2 &&
              [1, 2].map((offset) => {
                const photo = peek(offset);
                return (
                  <button
                    key={`${photo.id}-${offset}`}
                    type="button"
                    onClick={() => setCurrentSlide((currentSlide + offset) % slideCount)}
                    aria-label={`Show photo ${((currentSlide + offset) % slideCount) + 1}`}
                    className="hidden md:block border-[3px] border-ink p-0 bg-ink overflow-hidden group"
                  >
                    <img
                      src={getOptimizedSupabaseImageUrl(photo.image_url, 600)}
                      alt=""
                      loading="lazy"
                      className={`w-full h-[520px] object-cover grayscale contrast-125 group-hover:grayscale-0 transition ${
                        offset === 2 ? 'opacity-70' : 'opacity-85'
                      }`}
                    />
                  </button>
                );
              })}
          </div>

          {slideCount > 1 && (
            <div className="flex gap-1.5 mt-4" role="tablist" aria-label="Choose photo">
              {featuredPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  role="tab"
                  aria-selected={index === currentSlide}
                  aria-label={`Photo ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className="flex-1 h-6 flex items-center"
                >
                  <span
                    className={`block w-full h-1.5 ${
                      index === currentSlide ? 'bg-poster' : index < currentSlide ? 'bg-ink' : 'bg-rule'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Shows + merch cards */}
      {(navConfig.show_tours !== false || navConfig.show_merch === true || navConfig.show_videos === true) && (
        <section className="gp-container py-20 sm:py-24 flex flex-wrap gap-10">
          {navConfig.show_tours !== false && (
            <div className="flex-[1_1_480px] min-w-0 border-[3px] border-ink p-8 sm:p-10 flex flex-col gap-6">
              <p className="gp-mono text-sm uppercase">Upcoming shows</p>
              {nextShow ? (
                <>
                  <h2 className="gp-display text-5xl sm:text-[56px]">{nextShow.venue_name}</h2>
                  <p className="gp-mono text-lg font-bold">
                    {formatShortDate(nextShow.date)} · {nextShow.city}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="gp-display text-5xl sm:text-[56px]">
                    Next date
                    <br />
                    drops soon.
                  </h2>
                  {lastShow && (
                    <p className="text-[17px]">
                      Last played: <strong>{lastShow.venue_name.trim()}</strong>, {lastShow.city} —{' '}
                      {formatShortDate(lastShow.date)}
                    </p>
                  )}
                </>
              )}
              <div className="flex flex-wrap gap-3 mt-auto">
                {nextShow?.ticket_link && (
                  <a href={nextShow.ticket_link} target="_blank" rel="noopener noreferrer" className="gp-btn gp-btn-red">
                    Get tickets ↗
                  </a>
                )}
                <Link href="/tours" className="gp-btn gp-btn-ink">
                  All dates →
                </Link>
              </div>
            </div>
          )}

          {navConfig.show_merch === true ? (
            <div className="flex-[1_1_480px] min-w-0 bg-ink text-paper p-8 sm:p-10 flex flex-wrap gap-6 items-center">
              <div className="flex-[1_1_220px] min-w-0">
                <p className="gp-mono text-sm uppercase text-poster-light mb-4">Merch</p>
                <h2 className="gp-display text-5xl">Wear the songs.</h2>
                <Link href="/merch" className="gp-btn gp-btn-red mt-6">
                  Shop the drop
                </Link>
              </div>
              {merch.length > 0 && (
                <div className="flex-[1_1_220px] min-w-0 grid grid-cols-2 gap-3">
                  {merch.map((item) => {
                    const image = item.image_urls?.[0] || item.image_url;
                    return image ? (
                      <img
                        key={item.id}
                        src={getOptimizedSupabaseImageUrl(image, 500)}
                        alt={item.name}
                        className="w-full aspect-[3/4] object-cover border-[3px] border-paper"
                        style={{ objectPosition: item.image_positions?.[0] || 'center' }}
                      />
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ) : navConfig.show_videos === true ? (
            <Link
              href="/videos"
              className="flex-[1_1_480px] min-w-0 bg-ink text-paper p-8 sm:p-10 flex flex-col justify-between gap-6 hover:bg-poster transition-colors"
            >
              <p className="gp-mono text-sm uppercase text-poster-light">Videos</p>
              <h2 className="gp-display text-5xl">Watch us live.</h2>
              <span className="font-bold">Music videos, covers and live sets →</span>
            </Link>
          ) : null}
        </section>
      )}

      {/* Show-soon pop-up */}
      {notificationTour && showNotification && (
        <div
          role="status"
          className={`fixed top-24 right-4 md:right-8 z-40 ${isClosing ? 'animate-slide-out' : 'animate-slide-in'}`}
        >
          <div className="bg-paper border-[3px] border-ink shadow-hard-red w-[calc(100vw-2rem)] max-w-md p-5 flex items-center gap-4">
            <span className="w-3 h-3 bg-poster flex-shrink-0 animate-pulse" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="gp-mono text-xs uppercase">Next show</p>
              <h3 className="font-poster uppercase text-lg truncate">{notificationTour.venue_name}</h3>
              <p className="gp-mono text-sm">
                {formatShortDate(notificationTour.date)} · {notificationTour.city}
              </p>
            </div>
            {notificationTour.ticket_link && (
              <a
                href={notificationTour.ticket_link}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-btn gp-btn-red min-h-[44px] px-4 text-sm"
              >
                Tickets
              </a>
            )}
            <button
              type="button"
              onClick={() => setShowNotification(false)}
              aria-label="Close"
              className="w-11 h-11 font-bold text-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
