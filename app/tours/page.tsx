import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const revalidate = 60; // Revalidate every 60 seconds (ISR)

interface Tour {
  id: string;
  date: string;
  venue_name: string;
  city: string;
  ticket_link: string;
  status: 'upcoming' | 'past' | 'cancelled';
  description: string | null;
}

async function getTours() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { upcoming: [], past: [] };
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: upcomingData, error: upcomingError } = await supabase
      .from('tours')
      .select('*')
      .eq('status', 'upcoming')
      .order('date', { ascending: true });

    const { data: pastData, error: pastError } = await supabase
      .from('tours')
      .select('*')
      .eq('status', 'past')
      .order('date', { ascending: false });

    if (upcomingError || pastError) {
      console.error('Error fetching tours:', upcomingError || pastError);
    }

    return {
      upcoming: upcomingData || [],
      past: pastData || [],
    };
  } catch (error) {
    console.error('Error:', error);
    return { upcoming: [], past: [] };
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ToursPage() {
  const { upcoming, past } = await getTours();

  return (
    <main>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-10 sm:py-12">
        <div className="container-custom">
          <h1 className="heading-display mb-4" style={{ color: 'var(--secondary)' }}>TOUR DATES</h1>
          <p className="text-lg sm:text-xl text-gray-300">
            Catch Tarana live on stage. See dates and grab your tickets now.
          </p>
        </div>
      </section>

      {/* Upcoming Tours */}
      <section className="py-10 sm:py-12 bg-black">
        <div className="container-custom">
          <h2 className="heading-lg mb-12 text-white">Upcoming Shows</h2>

          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((tour) => (
                <div
                  key={tour.id}
                  className="border-l-4 bg-white p-6 rounded-lg hover:shadow-lg transition-shadow"
                  style={{ borderLeftColor: 'var(--accent)' }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                        {formatDate(tour.date)}
                      </p>
                      <h3 className="heading-md mt-2">{tour.venue_name}</h3>
                      <p className="text-gray-600 mt-1">{tour.city}</p>
                      {tour.description && (
                        <p className="text-gray-600 mt-2">{tour.description}</p>
                      )}
                    </div>
                    <a
                      href={tour.ticket_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary whitespace-nowrap"
                    >
                      Get Tickets
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-300 text-lg">
                No upcoming shows scheduled. Follow us for announcements!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Past Tours */}
      {past.length > 0 && (
        <section className="py-10 sm:py-12 bg-black">
          <div className="container-custom">
            <h2 className="heading-lg mb-12 text-white">Past Shows</h2>

            <div className="space-y-4">
              {past.map((tour) => (
                <div
                  key={tour.id}
                  className="border-l-4 border-gray-400 bg-white p-6 rounded-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-gray-600 font-bold text-lg">
                        {formatDate(tour.date)}
                      </p>
                      <h3 className="heading-md mt-2">{tour.venue_name}</h3>
                      <p className="text-gray-600 mt-1">{tour.city}</p>
                    </div>
                    <span className="text-gray-500 font-semibold">
                      Finished
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-black text-white py-10 sm:py-12">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <h2 className="heading-lg mb-6">Don't Miss A Show</h2>
          <p className="text-lg mb-8 text-gray-300">
            Subscribe to our newsletter for tour announcements and exclusive
            updates.
          </p>
          <a href="/contact" className="btn-primary">
            Stay Updated
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
