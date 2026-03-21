import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Navigation />

      {/* Hero Section */}
      <section className="bg-black text-white py-20 sm:py-32">
        <div className="container-custom text-center">
          <h1 className="heading-display mb-4 text-red-600">TARANA</h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-300">
            Experience the raw energy of live rock music
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/tours" className="btn-primary">
              View Tours
            </a>
            <a href="/about" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tours */}
            <div className="text-center">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="heading-md mb-4">Upcoming Tours</h3>
              <p className="text-gray-600 mb-6">
                Catch us live on stage. Check out our upcoming tour dates and grab your tickets.
              </p>
              <a href="/tours" className="btn-primary">
                View Tours
              </a>
            </div>

            {/* Merchandise */}
            <div className="text-center">
              <div className="text-4xl mb-4">🎸</div>
              <h3 className="heading-md mb-4">Merchandise</h3>
              <p className="text-gray-600 mb-6">
                Get exclusive Tarana merchandise. T-shirts, vinyl records, and more.
              </p>
              <a href="/merch" className="btn-primary">
                Shop Now
              </a>
            </div>

            {/* Videos */}
            <div className="text-center">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="heading-md mb-4">Videos</h3>
              <p className="text-gray-600 mb-6">
                Watch our latest performances, music videos, and behind-the-scenes content.
              </p>
              <a href="/videos" className="btn-primary">
                Watch Videos
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News / CTA */}
      <section className="bg-black text-white py-16 sm:py-24">
        <div className="container-custom max-w-2xl mx-auto text-center">
          <h2 className="heading-lg mb-6">Stay Connected</h2>
          <p className="text-lg mb-8 text-gray-300">
            Get the latest news about Tarana. Subscribe to our mailing list or follow us on social media.
          </p>
          <a href="/contact" className="btn-primary">
            Get In Touch
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
