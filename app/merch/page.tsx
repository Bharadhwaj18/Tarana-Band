import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MerchStore from '@/components/MerchStore';

export const dynamic = 'force-dynamic'; // Stock changes need to be real-time

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  image_urls?: string[] | null;
  price: number;
  external_link: string;
  is_active: boolean;
  order_position: number;
  size_stock?: { [size: string]: number } | null;
}

interface MerchCheckoutConfig {
  qr_code_url?: string;
  disclaimer?: string;
}

async function getMerchandiseData(): Promise<{ products: Product[]; checkoutConfig: MerchCheckoutConfig }> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { products: [], checkoutConfig: {} };
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
      return { products: [], checkoutConfig: {} };
    }

    const { data: checkoutData, error: checkoutError } = await supabase
      .from('general_config')
      .select('content')
      .eq('section_name', 'merch_checkout')
      .eq('is_active', true)
      .single();

    if (checkoutError && checkoutError.code !== 'PGRST116') {
      console.error('Error fetching merch checkout config:', checkoutError);
    }

    return {
      products: data || [],
      checkoutConfig: (checkoutData?.content as MerchCheckoutConfig) || {},
    };
  } catch (error) {
    console.error('Error:', error);
    return { products: [], checkoutConfig: {} };
  }
}

export default async function MerchPage() {
  const { products, checkoutConfig } = await getMerchandiseData();

  return (
    <main>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-10 sm:py-12">
        <div className="container-custom">
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold mb-6" style={{ color: 'var(--secondary)' }}>MERCHANDISE</h1>
          <p className="text-lg sm:text-xl text-gray-300">
            Support Tarana and get exclusive merchandise. Limited edition items available now.
          </p>
        </div>
      </section>

      <MerchStore products={products} checkoutConfig={checkoutConfig} />

      {/* Info Section */}
      <section className="py-10 sm:py-12 bg-black text-white border-t border-gray-700">
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
