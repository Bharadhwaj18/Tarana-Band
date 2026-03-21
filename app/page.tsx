'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { createClient } from '@supabase/supabase-js';

interface GalleryPhoto {
  id: string;
  title: string | null;
  image_url: string;
  order: number;
}

interface NavigationConfig {
  logo_black?: string;
  logo_white?: string;
  show_about?: boolean;
  show_tours?: boolean;
  show_merch?: boolean;
  show_videos?: boolean;
  show_contact?: boolean;
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
    albums: number;
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

export default function Home() {
  const [config, setConfig] = useState<HomepageConfig>({});
  const [navConfig, setNavConfig] = useState<NavigationConfig>({});
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        setLoading(false);
        return;
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Fetch homepage config (includes featured photos)
      const { data: homepageData } = await supabase.from('homepage_config').select('*').eq('is_active', true);

      if (homepageData) {
        const configData: HomepageConfig = {};
        homepageData.forEach((item: any) => {
          configData[item.section_name as keyof HomepageConfig] = item.content;
        });
        setConfig(configData);
      }

      // Fetch general config (navigation, branding, fonts, social)
      const { data: generalData } = await supabase
        .from('general_config')
        .select('*')
        .eq('is_active', true);

      if (generalData) {
        const generalConfig: any = {};
        generalData.forEach((item: any) => {
          generalConfig[item.section_name] = item.content;
        });

        // Build navigation config from branding + navigation sections
        const navigationConfig: NavigationConfig = {
          logo_black: generalConfig.branding?.logo_black,
          logo_white: generalConfig.branding?.logo_white,
          show_about: generalConfig.navigation?.show_about !== false,
          show_tours: generalConfig.navigation?.show_tours !== false,
          show_merch: generalConfig.navigation?.show_merch !== false,
          show_videos: generalConfig.navigation?.show_videos !== false,
          show_contact: generalConfig.navigation?.show_contact !== false,
        };

        setNavConfig(navigationConfig);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const defaultHero = {
    title: 'TARANA',
    subtitle: 'Classical Roots, Rock Energy',
    background_image: '',
    background_video: '',
    video_storage_path: '',
    cta_text: 'View Tours',
    cta_link: '/tours',
  };

  const defaultStats = {
    shows_played: 150,
    fans: 50000,
    years_active: 5,
    albums: 3,
  };

  const hero = config.hero || defaultHero;
  const stats = config.stats || defaultStats;
  const musicEmbed = config.music_embed;
  const featuredPhotos = config.featured_photos?.photos?.sort((a, b) => a.order - b.order) || [];

  // Auto-play carousel
  useEffect(() => {
    if (featuredPhotos.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredPhotos.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(timer);
    }
  }, [featuredPhotos.length]);

  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, featuredPhotos.length));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredPhotos.length) % Math.max(1, featuredPhotos.length));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <main className="bg-black">
      {/* Epic Hero Section with Video/Image Background - Navigation Overlaid */}
      <section className="relative h-screen overflow-hidden bg-black">
        {/* Background Video */}
        {hero.background_video && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={hero.background_video} type="video/mp4" />
            <source src={hero.background_video} type="video/webm" />
          </video>
        )}

        {/* Fallback Background Image */}
        {!hero.background_video && hero.background_image && (
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${hero.background_image})`
            }}
          />
        )}

        {/* Navigation Overlay */}
        <Navigation isOverlay={true} config={navConfig} />

        {/* Animated Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black"></div>

        {/* Content - Positioned at Bottom */}
        <div className="absolute bottom-24 left-0 right-0 z-10 text-center px-4">
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold animate-pulse mb-6">
            {hero.title}
          </h1>
          <p className="text-2xl sm:text-3xl md:text-4xl text-white/90 max-w-3xl mx-auto mb-12 font-light tracking-wide">
            {hero.subtitle}
          </p>
          <a
            href={hero.cta_link}
            className="inline-block px-12 py-4 bg-gold hover:bg-gold-light text-black font-bold text-xl rounded-full transform hover:scale-105 transition-all shadow-2xl shadow-gold/50"
          >
            {hero.cta_text}
          </a>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-8 h-8 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Section - Making Band Look HUGE */}
      {(stats.shows_played > 0 || stats.fans > 0 || stats.years_active > 0 || stats.albums > 0) && (
        <section className="py-10 bg-gradient-to-b from-black to-gray-900">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.shows_played > 0 && (
                <div className="text-center transform hover:scale-110 transition-transform">
                  <div className="text-6xl md:text-7xl font-bold text-gold mb-2">
                    {stats.shows_played}+
                  </div>
                  <div className="text-gray-400 text-lg uppercase tracking-widest">Shows Played</div>
                </div>
              )}
              {stats.fans > 0 && (
                <div className="text-center transform hover:scale-110 transition-transform">
                  <div className="text-6xl md:text-7xl font-bold text-gold mb-2">
                    {(stats.fans / 1000).toFixed(0)}K+
                  </div>
                  <div className="text-gray-400 text-lg uppercase tracking-widest">Streams Across Platforms</div>
                </div>
              )}
              {stats.years_active > 0 && (
                <div className="text-center transform hover:scale-110 transition-transform">
                  <div className="text-6xl md:text-7xl font-bold text-gold mb-2">
                    {stats.years_active}+
                  </div>
                  <div className="text-gray-400 text-lg uppercase tracking-widest">Years Rocking</div>
                </div>
              )}
              {stats.albums > 0 && (
                <div className="text-center transform hover:scale-110 transition-transform">
                  <div className="text-6xl md:text-7xl font-bold text-gold mb-2">
                    {stats.albums}
                  </div>
                  <div className="text-gray-400 text-lg uppercase tracking-widest">Albums Released</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Latest Music Embed Section */}
      {musicEmbed && musicEmbed.embed_url && (
        <section className="py-10 bg-gray-900">
          <div className="container-custom">
            <h2 className="text-5xl font-display font-bold text-center text-gold mb-12">
              {musicEmbed.title || 'Listen Now'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Music Embed */}
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                {musicEmbed.type === 'spotify' ? (
                  <iframe
                    src={musicEmbed.embed_url}
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="w-full"
                  ></iframe>
                ) : (
                  <iframe
                    width="100%"
                    height="380"
                    src={musicEmbed.embed_url}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full"
                  ></iframe>
                )}
              </div>

              {/* Right: Description */}
              {musicEmbed.description && (
                <div className="text-white">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg leading-relaxed text-gray-300 whitespace-pre-wrap">
                      {musicEmbed.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Photos Carousel - Full Width */}
      {featuredPhotos.length > 0 && (
        <section className="py-10 bg-black overflow-hidden">
          <div className="text-center mb-12">
            <h2 className="text-5xl sm:text-6xl font-display font-bold text-gold mb-4">
              On Stage
            </h2>
            <p className="text-xl text-gray-400">Live moments that define us</p>
          </div>

          {/* Carousel Container */}
          <div className="relative">
            {/* Main Carousel */}
            <div className="overflow-hidden w-full">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${(currentSlide / featuredPhotos.length) * 100}%)`,
                  width: `${featuredPhotos.length * 100}%`
                }}
              >
                {featuredPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="w-full flex-shrink-0 relative"
                    style={{ width: `${100 / featuredPhotos.length}%` }}
                  >
                    {/* Full Height Image */}
                    <div className="relative h-[70vh] sm:h-[80vh]">
                      <img
                        src={photo.image_url}
                        alt={photo.title || 'TARANA Live'}
                        className="w-full h-full object-cover"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-16">
                        <div className="max-w-4xl mx-auto text-center">
                          <h3 className="text-3xl sm:text-5xl font-bold text-white mb-4">
                            {photo.title || 'TARANA Live'}
                          </h3>
                          <div className="w-24 h-1 bg-gold mx-auto"></div>
                        </div>
                      </div>

                      {/* Photo Counter */}
                      <div className="absolute top-8 right-8 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
                        <span className="text-gold font-semibold">
                          {index + 1} / {featuredPhotos.length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {featuredPhotos.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-gold p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Previous photo"
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-gold p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 z-10"
                  aria-label="Next photo"
                >
                  <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Dots Navigation */}
            {featuredPhotos.length > 1 && (
              <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {featuredPhotos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide
                        ? 'bg-gold scale-125'
                        : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to photo ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Auto-play hint */}
          {featuredPhotos.length > 1 && (
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                Auto-advancing every 5 seconds • Use arrows or dots to navigate • {featuredPhotos.length} photos
              </p>
            </div>
          )}
        </section>
      )}

      {/* Quick Access Grid */}
      {(navConfig.show_tours !== false || navConfig.show_merch !== false || navConfig.show_videos !== false) && (
        <section className="py-10 bg-gradient-to-b from-gray-900 to-black">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Upcoming Tours - Only show if enabled */}
              {navConfig.show_tours !== false && (
                <a
                  href="/tours"
                  className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gold/20 transition-all"
                >
                  <div className="absolute top-0 right-0 text-9xl opacity-5 group-hover:opacity-10 transition-opacity">
                    🎤
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-bold text-gold mb-4">Upcoming Tours</h3>
                    <p className="text-gray-300 mb-6">
                      Catch us live on stage. Energy, passion, unforgettable nights.
                    </p>
                    <span className="text-gold font-semibold group-hover:translate-x-2 inline-block transition-transform">
                      View Dates →
                    </span>
                  </div>
                </a>
              )}

              {/* Exclusive Merch - Only show if enabled */}
              {navConfig.show_merch !== false && (
                <a
                  href="/merch"
                  className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gold/20 transition-all"
                >
                  <div className="absolute top-0 right-0 text-9xl opacity-5 group-hover:opacity-10 transition-opacity">
                    🎸
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-bold text-gold mb-4">Exclusive Merch</h3>
                    <p className="text-gray-300 mb-6">
                      Limited edition gear. Support the band, look amazing.
                    </p>
                    <span className="text-gold font-semibold group-hover:translate-x-2 inline-block transition-transform">
                      Shop Now →
                    </span>
                  </div>
                </a>
              )}

              {/* Latest Videos - Only show if enabled */}
              {navConfig.show_videos !== false && (
                <a
                  href="/videos"
                  className="group relative bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gold/20 transition-all"
                >
                  <div className="absolute top-0 right-0 text-9xl opacity-5 group-hover:opacity-10 transition-opacity">
                    🎥
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-bold text-gold mb-4">Latest Videos</h3>
                    <p className="text-gray-300 mb-6">
                      Behind the scenes, live performances, music videos.
                    </p>
                    <span className="text-gold font-semibold group-hover:translate-x-2 inline-block transition-transform">
                      Watch Now →
                    </span>
                  </div>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action - Only show if contact is enabled */}
      {navConfig.show_contact !== false && (
        <section className="py-12 bg-gradient-to-r from-gold-dark via-gold to-gold-light">
          <div className="container-custom text-center">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-black mb-6">
              Stay Connected
            </h2>
            <p className="text-xl text-black/80 mb-10 max-w-2xl mx-auto">
              Get exclusive updates, early ticket access, and behind-the-scenes content
            </p>
            <a
              href="/contact"
              className="inline-block px-12 py-4 bg-black hover:bg-gray-900 text-gold font-bold text-xl rounded-full transform hover:scale-105 transition-all shadow-2xl"
            >
              Get In Touch
            </a>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
