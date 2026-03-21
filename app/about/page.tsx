'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { createClient } from '@supabase/supabase-js';

interface BandMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  order_position: number;
}

interface AboutConfig {
  hero_title?: string;
  hero_description?: string;
  story_title?: string;
  story_paragraphs?: string[];
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

export default function AboutPage() {
  const [bandMembers, setBandMembers] = useState<BandMember[]>([]);
  const [aboutConfig, setAboutConfig] = useState<AboutConfig>({
    hero_title: "About TARANA",
    hero_description: "Tarana is a dynamic rock band with electrifying performances and unforgettable music. With 7 talented musicians, we bring raw energy and passion to every stage.",
    story_title: "Our Story",
    story_paragraphs: [
      "Tarana was formed with a vision to bring authentic rock music to audiences worldwide. What started as a passion project evolved into a full-fledged movement.",
      "Our music blends classic rock influences with contemporary energy, creating a sound that resonates with fans across generations. Each member brings unique talent and dedication to the band.",
      "From intimate venues to sold-out shows, every performance is a celebration of music and connection. Join us on this incredible journey."
    ]
  });
  const [navConfig, setNavConfig] = useState<NavigationConfig>({});
  const [loading, setLoading] = useState(true);

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

      // Fetch band members
      const { data: membersData, error: membersError } = await supabase
        .from('band_members')
        .select('*')
        .order('order_position', { ascending: true });

      if (membersError) {
        console.error('Error fetching band members:', membersError);
      } else {
        setBandMembers(membersData || []);
      }

      // Fetch about page config
      const { data: configData, error: configError } = await supabase
        .from('about_config')
        .select('content')
        .eq('section_name', 'about_page')
        .single();

      if (configError) {
        console.error('Error fetching about config:', configError);
      } else if (configData?.content) {
        setAboutConfig(configData.content as AboutConfig);
      }

      // Fetch general config (navigation, branding)
      const { data: generalData } = await supabase
        .from('general_config')
        .select('*')
        .eq('is_active', true);

      if (generalData) {
        const generalConfig: any = {};
        generalData.forEach((item: any) => {
          generalConfig[item.section_name] = item.content;
        });

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

  return (
    <main className="bg-black">
      <Navigation config={navConfig} />

      {/* Hero Section with Gold Accent */}
      <section className="bg-black text-white py-10 sm:py-12">
        <div className="container-custom">
          <h1 className="text-7xl sm:text-8xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold mb-6">
            {aboutConfig.hero_title || "About TARANA"}
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl">
            {aboutConfig.hero_description || "Tarana is a dynamic rock band with electrifying performances and unforgettable music."}
          </p>
        </div>
      </section>

      {/* Band Members Section */}
      <section className="py-10 bg-gradient-to-b from-black to-gray-900">
        <div className="container-custom">
          <h2 className="text-5xl font-display font-bold text-center text-gold mb-16">
            Meet The Band
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Loading band members...</p>
            </div>
          ) : bandMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {bandMembers.map((member) => (
                <div
                  key={member.id}
                  className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-gold/20 transition-all"
                >
                  {member.image_url && (
                    <div className="w-full h-72 bg-gray-800 overflow-hidden">
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-2xl font-display font-bold text-gold mb-2">
                      {member.name}
                    </h3>
                    <p className="text-gold-light font-semibold mb-4 text-sm uppercase tracking-wider">
                      {member.role}
                    </p>
                    <p className="text-gray-300 leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-800 rounded-2xl p-12 max-w-2xl mx-auto">
                <p className="text-gray-400 text-lg mb-4">
                  Band members coming soon!
                </p>
                <p className="text-gray-500 text-sm">
                  Add band members from the{' '}
                  <a href="/admin/members" className="text-gold hover:text-gold-light underline">
                    Admin Panel
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Story Section */}
      <section className="py-10 bg-gray-900">
        <div className="container-custom max-w-4xl">
          <h2 className="text-5xl font-display font-bold text-center text-gold mb-12">
            {aboutConfig.story_title || "Our Story"}
          </h2>
          <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
            {aboutConfig.story_paragraphs && aboutConfig.story_paragraphs.length > 0 ? (
              aboutConfig.story_paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            ) : (
              <>
                <p>
                  Tarana was formed with a vision to bring authentic rock music to
                  audiences worldwide. What started as a passion project evolved into
                  a full-fledged movement.
                </p>
                <p>
                  Our music blends classic rock influences with contemporary energy,
                  creating a sound that resonates with fans across generations. Each
                  member brings unique talent and dedication to the band.
                </p>
                <p>
                  From intimate venues to sold-out shows, every performance is a
                  celebration of music and connection. Join us on this incredible
                  journey.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gradient-to-r from-gold-dark via-gold to-gold-light">
        <div className="container-custom text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-black mb-6">
            Experience TARANA Live
          </h2>
          <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
            Don't miss our next show. Pure energy, unforgettable nights.
          </p>
          <a
            href="/tours"
            className="inline-block px-12 py-4 bg-black hover:bg-gray-900 text-gold font-bold text-xl rounded-full transform hover:scale-105 transition-all shadow-2xl"
          >
            See Tour Dates
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
