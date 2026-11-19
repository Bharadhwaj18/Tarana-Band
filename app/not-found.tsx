import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <main className="gp min-h-screen flex flex-col">
      <Navigation />
      <section className="gp-container flex-1 py-20 sm:py-28">
        <p className="gp-mono text-sm uppercase mb-3">Error 404</p>
        <h1 className="gp-display text-[clamp(64px,11vw,170px)] leading-[0.84]">
          Wrong
          <br />
          <span className="text-poster">stage.</span>
        </h1>
        <p className="mt-7 mb-10 text-lg max-w-[42ch] leading-relaxed">
          This page isn&apos;t here right now. It may have moved, or it&apos;s coming back soon.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="gp-btn gp-btn-ink">
            Back to home
          </Link>
          <Link href="/tours" className="gp-btn gp-btn-outline">
            Live dates
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
