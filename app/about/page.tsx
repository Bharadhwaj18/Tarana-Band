'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAppConfig } from '@/components/AppConfigProvider';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_HEADLINE_STAGES, DEFAULT_MORE_STAGES } from '@/lib/aboutStages';

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
  stages_headline?: string[];
  stages_more?: string[];
}

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

// Short label shown on each member's photo
function instrumentTag(role: string) {
  const r = role.toLowerCase();
  if (r.includes('vocal')) return 'Vocals';
  if (r.includes('flaut') || r.includes('flute')) return 'Flute';
  if (r.includes('percuss')) return 'Percussion';
  if (r.includes('drum')) return 'Drums';
  if (r.includes('bass')) return 'Bass';
  if (r.includes('guitar')) return 'Guitar';
  if (r.includes('key')) return 'Keys';
  return role.split('/')[0].trim();
}

// Splits the description into a lead (first two sentences) and the rest
function splitLead(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences || sentences.length <= 2) return { lead: text, rest: '' };
  return { lead: sentences.slice(0, 2).join('').trim(), rest: sentences.slice(2).join('').trim() };
}

export default function AboutPage() {
  const { navConfig } = useAppConfig();
  const [bandMembers, setBandMembers] = useState<BandMember[]>([]);
  const [storyPhoto, setStoryPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aboutConfig, setAboutConfig] = useState<AboutConfig>({
    hero_title: 'About TARANA',
    hero_description:
      'Tarana is a seven-piece band from Bengaluru fusing semi-classical, rock and more. Carnatic guitar and Carnatic flute, a touch of Western rock, all carried by soulful Hindustani vocals.',
    story_title: 'Our Story',
    story_paragraphs: [],
  });

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

      const [{ data: membersData }, { data: configData }, { data: photoData }] = await Promise.all([
        supabase.from('band_members').select('*').order('order_position', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('general_config').select('content').eq('section_name', 'about_page').maybeSingle(),
        supabase.from('gallery_photos').select('image_url').limit(6),
      ]);

      setBandMembers(membersData || []);
      if (configData?.content) setAboutConfig(configData.content as AboutConfig);
      if (photoData && photoData.length > 0) {
        setStoryPhoto(photoData[Math.min(5, photoData.length - 1)].image_url);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const memberCount = bandMembers.length;
  const countWord = memberCount > 0 && memberCount < NUMBER_WORDS.length ? NUMBER_WORDS[memberCount] : 'All';
  const { lead, rest } = splitLead(aboutConfig.hero_description || '');
  const storyParagraphs = aboutConfig.story_paragraphs || [];
  // Edited in admin -> About page; the built-in lists are used until a list has been saved
  const headlineStages = Array.isArray(aboutConfig.stages_headline) ? aboutConfig.stages_headline : DEFAULT_HEADLINE_STAGES;
  const moreStages = Array.isArray(aboutConfig.stages_more) ? aboutConfig.stages_more : DEFAULT_MORE_STAGES;

  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="gp-container pt-12 sm:pt-14 pb-16 sm:pb-20">
        <p className="gp-mono text-sm uppercase mb-3">{aboutConfig.hero_title || 'About Tarana'}</p>
        <h1 className="gp-display text-[clamp(64px,12vw,190px)] leading-[0.84]">
          {countWord} players.
          <br />
          <span className="text-poster">One sound.</span>
        </h1>
        <div className="flex flex-wrap gap-10 sm:gap-12 mt-12 sm:mt-14 pt-8 border-t-[3px] border-ink">
          <p className="flex-[1_1_480px] min-w-0 text-xl sm:text-[26px] leading-snug font-medium">{lead}</p>
          {rest && <p className="flex-[1_1_400px] min-w-0 text-[17px] leading-relaxed">{rest}</p>}
        </div>
      </section>

      {(headlineStages.length > 0 || moreStages.length > 0) && (
        <section aria-label="Where we have played" className="bg-ink text-paper">
          <div className="gp-container py-16 sm:py-20 text-center">
            <p className="gp-mono text-sm uppercase text-poster-light mb-6">As seen on stage at</p>
            {headlineStages.length > 0 && (
              <p className="font-poster uppercase text-[clamp(28px,4vw,56px)] leading-[1.1]">
                {headlineStages.map((stage, index) => (
                  <span key={`${stage}-${index}`}>
                    {stage}
                    {index < headlineStages.length - 1 && <span className="text-poster-light"> ✶ </span>}
                  </span>
                ))}
              </p>
            )}
            {moreStages.length > 0 && (
              <p className="gp-mono text-base leading-loose text-[#D6D0C4] mt-7">{moreStages.join(' · ')}</p>
            )}
          </div>
        </section>
      )}

      <section className="gp-container py-20 sm:py-24">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
          <h2 className="gp-display text-[clamp(56px,8vw,120px)]">The lineup</h2>
          {memberCount > 0 && (
            <p className="gp-mono text-[15px]">{String(memberCount).padStart(2, '0')} members</p>
          )}
        </div>

        {loading ? (
          <p className="gp-mono py-12">Loading the lineup…</p>
        ) : memberCount > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {bandMembers.map((member) => {
              const tags = member.bio
                .split('|')
                .map((tag) => tag.trim())
                .filter(Boolean);
              return (
                <article key={member.id} className="border-[3px] border-ink bg-white group">
                  <div className="relative border-b-[3px] border-ink overflow-hidden bg-ink">
                    {member.image_url ? (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        loading="lazy"
                        className="w-full aspect-[4/5] object-cover object-[50%_20%] block grayscale contrast-110 group-hover:grayscale-0 transition duration-300"
                      />
                    ) : (
                      <div className="w-full aspect-[4/5] bg-rule" />
                    )}
                    <span className="absolute top-3 left-3 bg-poster text-white gp-mono text-xs font-bold uppercase px-2.5 py-1.5">
                      {instrumentTag(member.role)}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-poster uppercase text-[26px] leading-none">{member.name}</h3>
                    <p className="gp-mono text-[13px] uppercase mt-1.5 mb-3.5">{member.role}</p>
                    {tags.length > 1 ? (
                      <ul className="flex flex-wrap gap-1.5 text-[13px]">
                        {tags.map((tag) => (
                          <li key={tag} className="border border-ink px-2 py-1">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[15px] leading-relaxed">{member.bio}</p>
                    )}
                  </div>
                </article>
              );
            })}

            {navConfig.show_contact !== false && (
              <Link
                href="/contact"
                className="border-[3px] border-dashed border-ink flex flex-col justify-center items-center text-center gap-3 p-8 min-h-[400px] hover:bg-ink hover:text-paper transition-colors"
              >
                <span className="gp-display text-[40px] leading-[0.95]">
                  Book the
                  <br />
                  full band
                </span>
                <span className="gp-mono text-sm">Fests · colleges · malls · private →</span>
              </Link>
            )}
          </div>
        ) : (
          <p className="gp-mono py-12">The lineup is coming soon.</p>
        )}
      </section>

      <section className="bg-poster text-white">
        <div className="gp-container py-20 sm:py-24 flex flex-wrap gap-14 items-center">
          <div className="flex-[1_1_480px] min-w-0">
            <p className="gp-mono text-sm uppercase mb-4">{aboutConfig.story_title || 'Our story'}</p>
            <h2 className="gp-display text-[clamp(48px,6vw,96px)] mb-7">It started as a jam.</h2>
            <div className="space-y-4 text-lg leading-relaxed max-w-[56ch]">
              {storyParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          {storyPhoto && (
            <img
              src={storyPhoto}
              alt="Tarana performing live"
              loading="lazy"
              className="flex-[1_1_440px] min-w-0 w-full aspect-[4/3] object-cover border-[3px] border-ink shadow-hard"
            />
          )}
        </div>
      </section>

      {navConfig.show_tours !== false && (
        <section className="gp-container py-16 sm:py-20 flex flex-wrap justify-between items-center gap-6">
          <h2 className="gp-display text-[clamp(40px,5vw,72px)]">Experience Tarana live.</h2>
          <Link href="/tours" className="gp-btn gp-btn-ink text-[17px]">
            See live dates →
          </Link>
        </section>
      )}

      <Footer />
    </main>
  );
}
