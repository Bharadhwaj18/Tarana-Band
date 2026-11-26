'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import MerchStore from '@/components/MerchStore';
import Ticker from '@/components/Ticker';

export default function MerchPage() {
  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="gp-container pt-12 sm:pt-14 pb-10 flex flex-wrap justify-between items-end gap-6">
        <div>
          <p className="gp-mono text-sm uppercase mb-3">Official Tarana merch</p>
          <h1 className="gp-display text-[clamp(72px,13vw,200px)] leading-[0.82]">
            Merch<span className="text-poster">.</span>
          </h1>
        </div>
        <div className="max-w-[36ch]">
          <p className="text-[17px] leading-relaxed">
            Limited runs. Every rupee goes into touring and recording. Pay by UPI, card, netbanking or wallet.
          </p>
          <Link href="/merch/orders" className="gp-mono text-sm uppercase font-bold underline decoration-poster underline-offset-4 mt-4 inline-block">
            Already ordered? Track your order →
          </Link>
        </div>
      </section>

      <MerchStore />

      <section className="bg-poster text-white">
        <div className="gp-container py-16 sm:py-20 flex flex-wrap justify-between items-center gap-8">
          <div className="flex-[1_1_480px] min-w-0">
            <h2 className="gp-display text-[clamp(40px,5vw,72px)] mb-4">Support the band.</h2>
            <p className="text-lg leading-relaxed max-w-[54ch]">
              All proceeds from merchandise go directly into Tarana&apos;s touring and recording. Your purchase helps us
              keep creating and performing the music you love.
            </p>
          </div>
          <Link href="/contact" className="gp-btn gp-btn-ink">
            Merch request? Tell us →
          </Link>
        </div>
      </section>

      <Ticker words={['Secure checkout via PhonePe', 'UPI', 'Cards', 'Netbanking', 'Wallets', 'Email updates on every order']} />

      <Footer />
    </main>
  );
}
