import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface BandMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string | null;
  order_position: number;
}

async function getBandMembers(): Promise<BandMember[]> {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return [];
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('band_members')
      .select('*')
      .order('order_position', { ascending: true });

    if (error) {
      console.error('Error fetching band members:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export default async function AboutPage() {
  const bandMembers = await getBandMembers();

  return (
    <main>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-16 sm:py-24">
        <div className="container-custom">
          <h1 className="heading-display mb-4 text-red-600">About TARANA</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl">
            Tarana is a dynamic rock band with electrifying performances and
            unforgettable music. With 7 talented musicians, we bring raw energy
            and passion to every stage.
          </p>
        </div>
      </section>

      {/* Band Members Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container-custom">
          <h2 className="heading-lg text-center mb-16">Meet The Band</h2>

          {bandMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {bandMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {member.image_url && (
                    <div className="w-full h-64 bg-gray-200 overflow-hidden">
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="heading-md mb-2">{member.name}</h3>
                    <p className="text-red-600 font-semibold mb-4">{member.role}</p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Band members coming soon. Check back later!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 sm:py-24 bg-gray-900 text-white">
        <div className="container-custom max-w-2xl">
          <h2 className="heading-lg text-center mb-8">Our Story</h2>
          <div className="space-y-6 text-gray-300">
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
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
