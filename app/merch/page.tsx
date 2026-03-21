import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
}

async function getMerchandise() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return [];
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('merchandise')
      .select('*')
      .eq('is_active', true)
      .order('order_position', { ascending: true });

    if (error) {
      console.error('Error fetching merchandise:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export default async function MerchPage() {
  const products = await getMerchandise();

  return (
    <main>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-16 sm:py-24">
        <div className="container-custom">
          <h1 className="heading-display mb-4 text-red-600">MERCHANDISE</h1>
          <p className="text-lg sm:text-xl text-gray-300">
            Support Tarana and get exclusive merchandise. Limited edition items available now.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container-custom">
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {product.image_url && (
                    <div className="w-full h-64 bg-gray-200 overflow-hidden">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="heading-md mb-2">{product.name}</h3>
                    <p className="text-red-600 font-bold text-lg mb-3">
                      ${product.price.toFixed(2)}
                    </p>
                    <p className="text-gray-600 mb-6">{product.description}</p>
                    <a
                      href={product.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary block text-center"
                    >
                      Buy Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Merchandise coming soon. Check back later!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 sm:py-24 bg-gray-900 text-white">
        <div className="container-custom max-w-2xl">
          <h2 className="heading-lg text-center mb-8">Support The Band</h2>
          <p className="text-gray-300 text-center mb-6">
            All proceeds from merchandise sales go directly to supporting Tarana's tour and
            recording efforts. Your purchase helps us continue creating and performing music
            you love.
          </p>
          <p className="text-gray-300 text-center">
            Have merchandise requests? Get in touch with us!
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
