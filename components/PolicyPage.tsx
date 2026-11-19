import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { BUSINESS, POLICIES_UPDATED, POLICY_LINKS } from '@/lib/business';

export interface PolicySection {
  heading: string;
  body: React.ReactNode;
}

interface Props {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  sections: PolicySection[];
  currentHref: string;
}

/** Shared layout for the legal pages: title, numbered sections, seller details and links to the other policies */
export default function PolicyPage({ eyebrow, title, intro, sections, currentHref }: Props) {
  return (
    <main className="gp min-h-screen">
      <Navigation />

      <section className="gp-container pt-14 sm:pt-20 pb-20 sm:pb-24 flex flex-wrap gap-12 items-start">
        <div className="flex-[1_1_560px] min-w-0 max-w-[760px]">
          <p className="gp-mono text-sm uppercase mb-3">{eyebrow}</p>
          <h1 className="gp-display text-[clamp(48px,7vw,104px)] leading-[0.86]">{title}</h1>
          <p className="gp-mono text-xs uppercase text-muted mt-5">Last updated {POLICIES_UPDATED}</p>
          <div className="mt-8 text-lg leading-relaxed">{intro}</div>

          <ol className="mt-10 flex flex-col">
            {sections.map((section, index) => (
              <li key={section.heading} className="py-7 border-t-[3px] border-ink">
                <h2 className="font-poster uppercase text-2xl sm:text-[28px] leading-none flex gap-4">
                  <span className="text-poster">{String(index + 1).padStart(2, '0')}</span>
                  <span>{section.heading}</span>
                </h2>
                <div className="mt-4 text-base sm:text-[17px] leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:underline [&_a]:decoration-poster [&_a]:underline-offset-2">
                  {section.body}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <aside className="flex-[1_1_280px] max-w-[360px] flex flex-col gap-6 lg:sticky lg:top-28">
          <div className="bg-ink text-paper p-6">
            <p className="gp-mono text-xs uppercase text-poster-light">Seller details</p>
            <dl className="mt-4 space-y-3 text-[15px]">
              <div>
                <dt className="gp-mono text-[11px] uppercase text-[#B8B2A6]">Operated by</dt>
                <dd className="font-bold">{BUSINESS.operator}, trading as {BUSINESS.brand}</dd>
              </div>
              <div>
                <dt className="gp-mono text-[11px] uppercase text-[#B8B2A6]">Location</dt>
                <dd>{BUSINESS.location}</dd>
              </div>
              <div>
                <dt className="gp-mono text-[11px] uppercase text-[#B8B2A6]">Email</dt>
                <dd>
                  <a href={`mailto:${BUSINESS.email}`} className="underline decoration-poster-light underline-offset-2 break-all">
                    {BUSINESS.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="gp-mono text-[11px] uppercase text-[#B8B2A6]">Phone</dt>
                <dd>
                  <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} className="underline decoration-poster-light underline-offset-2">
                    {BUSINESS.phone}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <nav aria-label="Policies" className="border-[3px] border-ink p-6">
            <p className="gp-mono text-xs uppercase mb-3">Policies</p>
            <ul className="flex flex-col gap-2.5">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={link.href === currentHref ? 'page' : undefined}
                    className={
                      link.href === currentHref
                        ? 'font-bold text-poster'
                        : 'hover:text-poster underline-offset-2 hover:underline'
                    }
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </section>

      <Footer />
    </main>
  );
}
