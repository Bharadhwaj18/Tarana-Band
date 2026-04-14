'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MerchStore from '@/components/MerchStore';

export default function MerchPage() {
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

      <MerchStore />

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
