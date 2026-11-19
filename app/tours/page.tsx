import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TourTicketButton from '@/components/TourTicketButton';
import { getTourStatus } from '@/lib/tours';
import { SHARE_IMAGE } from '@/lib/seo';
import { isPageEnabled } from '@/lib/pageVisibility';
import type { Metadata } from 'next';

// Rendered per request so the admin page switch and date-based Upcoming/Past are always current
export const dynamic = 'force-dynamic';

const description = 'Upcoming Tarana shows and tour dates, with tickets. Catch the band live on stage.';
const INSTAGRAM_URL = 'https://www.instagram.com/tarana_theband/';

export const metadata: Metadata = {
  title: 'Tour Dates',
  description,
  alternates: { canonical: '/tours' },
  openGraph: {
    title: 'Tour Dates | Tarana',
    description,
    url: 'https://taranaband.in/tours',
    images: [SHARE_IMAGE],
  },
  twitter: {
    title: 'Tour Dates | Tarana',
    description,
    images: [SHARE_IMAGE.url],
  },
};

interface Tour {
  id: string;
  date: string;
  venue_name: string;
  city: string;
  ticket_link: string;
  status: 'upcoming' | 'past' | 'cancelled';
  description: string | null;
}

async function getPageData() {
  const empty = { upcoming: [] as Tour[], past: [] as Tour[], heroPhoto: null as string | null };
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return empty;
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const [{ data, error }, { data: photos }] = await Promise.all([
      supabase.from('tours').select('*').neq('status', 'cancelled').order('date', { ascending: true }),
      supabase.from('gallery_photos').select('image_url').limit(3),
    ]);

    if (error) {
      console.error('Error fetching tours:', error);
    }

    // Split by date so shows move to past automatically once the day is over
    const tours: Tour[] = data || [];
    return {
      upcoming: tours.filter((tour) => getTourStatus(tour) === 'upcoming'),
      past: tours.filter((tour) => getTourStatus(tour) === 'past').reverse(),
      heroPhoto: photos && photos.length > 0 ? photos[photos.length - 1].image_url : null,
    };
  } catch (error) {
    console.error('Error:', error);
    return empty;
  }
}

function dateParts(dateString: string) {
  const date = new Date(dateString);
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    year: date.getFullYear(),
    short: `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`,
  };
}

export default async function ToursPage() {
  if (!(await isPageEnabled('show_tours'))) notFound();
  const { upcoming, past, heroPhoto } = await getPageData();

  // Past shows grouped by year, newest first
  const pastByYear = past.reduce<Record<number, Tour[]>>((groups, tour) => {
    const year = new Date(tour.date).getFullYear();
    (groups[year] = groups[year] || []).push(tour);
    return groups;
  }, {});
  const pastYears = Object.keys(pastByYear).map(Number).sort((a, b) => b - a);

  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="relative overflow-hidden bg-ink text-paper">
        {heroPhoto && (
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 opacity-35"
          />
        )}
        <div className="relative gp-container pt-20 sm:pt-24 pb-16 sm:pb-20">
          <p className="gp-mono text-sm uppercase text-poster-light mb-3">Tour dates</p>
          <h1 className="gp-display text-[clamp(72px,13vw,200px)] leading-[0.82]">
            Live
            <br />
            dates.
          </h1>
          <p className="mt-7 text-lg sm:text-[19px] max-w-[44ch] leading-normal">
            Catch Tarana live on stage. See dates and grab your tickets now.
          </p>
        </div>
      </section>

      <section className="gp-container pt-16 sm:pt-20 pb-10">
        <div className="flex flex-wrap justify-between items-baseline gap-4 mb-6">
          <h2 className="gp-display text-5xl sm:text-[56px]">Upcoming</h2>
          <span className="gp-mono text-sm">
            {String(upcoming.length).padStart(2, '0')} {upcoming.length === 1 ? 'show' : 'shows'} booked
          </span>
        </div>

        {upcoming.length > 0 ? (
          <div className="flex flex-col gap-6">
            {upcoming.map((tour) => {
              const d = dateParts(tour.date);
              return (
                <article
                  key={tour.id}
                  className="grid grid-cols-[96px_1fr] sm:grid-cols-[130px_minmax(0,1fr)_minmax(0,200px)_auto] gap-x-6 gap-y-4 items-center p-5 sm:p-6 bg-white border-[3px] border-ink shadow-hard-red"
                >
                  <div className="text-center border-r-[3px] border-ink pr-5 sm:pr-6 row-span-2 sm:row-span-1">
                    <div className="font-poster text-5xl sm:text-[52px] leading-[0.9]">{d.day}</div>
                    <div className="gp-mono text-sm font-bold uppercase mt-1.5">
                      {d.month} · {d.weekday}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-poster uppercase text-2xl sm:text-[32px] leading-none">{tour.venue_name}</h3>
                    {tour.description && <p className="text-base mt-2">{tour.description}</p>}
                    <p className="gp-mono text-[15px] mt-2 sm:hidden">{tour.city}</p>
                  </div>
                  <div className="gp-mono text-base hidden sm:block">{tour.city}</div>
                  {tour.ticket_link && (
                    <div className="col-start-2 sm:col-start-auto">
                      <TourTicketButton href={tour.ticket_link} venueName={tour.venue_name} city={tour.city} date={tour.date} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="border-[3px] border-dashed border-ink p-8 sm:p-12 flex flex-wrap justify-between items-center gap-8">
            <div className="flex-[1_1_420px] min-w-0">
              <p className="font-poster uppercase text-3xl sm:text-[40px] leading-none">Nothing on the poster yet.</p>
              <p className="mt-3.5 text-[17px] leading-relaxed">
                New dates go up on Instagram first. Want us at your fest, college or venue? Let&apos;s talk.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="gp-btn gp-btn-ink">
                Follow on Instagram
              </a>
              <Link href="/contact" className="gp-btn gp-btn-red">
                Book Tarana
              </Link>
            </div>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="gp-container pt-10 pb-20 sm:pb-24">
          <div className="flex flex-wrap justify-between items-baseline gap-4 mb-4">
            <h2 className="gp-display text-5xl sm:text-[56px]">Past shows</h2>
            <span className="gp-mono text-sm">{past.length} played</span>
          </div>
          {pastYears.map((year) => (
            <div key={year}>
              <div className="font-poster text-[22px] pt-4 pb-2 border-b-[3px] border-ink">{year}</div>
              {pastByYear[year].map((tour) => (
                <div
                  key={tour.id}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[180px_minmax(0,1fr)_minmax(0,200px)_120px] gap-x-4 gap-y-1 items-center py-6 border-b border-ink"
                >
                  <div className="gp-mono text-base sm:text-lg font-bold">{dateParts(tour.date).short}</div>
                  <div className="font-poster uppercase text-2xl sm:text-[30px] leading-none row-start-2 sm:row-start-auto col-span-2 sm:col-span-1">
                    {tour.venue_name}
                  </div>
                  <div className="gp-mono text-[15px] row-start-3 sm:row-start-auto">{tour.city}</div>
                  <div className="justify-self-end gp-mono text-xs uppercase border border-ink px-3 py-2 row-start-1 col-start-2 sm:row-start-auto sm:col-start-auto">
                    Played
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      <Footer />
    </main>
  );
}
