import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import FontSetter from "@/components/FontSetter";
import ColorSetter from "@/components/ColorSetter";
import AppConfigProvider from "@/components/AppConfigProvider";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_PROFILES } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Classical Roots, Rock Energy`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: `${SITE_NAME} | Classical Roots, Rock Energy`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Classical Roots, Rock Energy`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Structured data so Google knows this is the band's own site and links it to the band's profiles
const bandSchema = {
  "@context": "https://schema.org",
  "@type": "MusicGroup",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  genre: ["Rock"],
  sameAs: SOCIAL_PROFILES,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Righteous&family=Bebas+Neue&family=Oswald&family=Playfair+Display&family=Montserrat&family=Raleway&family=Poppins:wght@400;500;600;700&family=Inter&family=Roboto&family=Lato&display=swap"
          rel="stylesheet"
        />
        {/* Favicon with cache busting */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bandSchema) }}
        />
      </head>
      <body className="font-body">
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}</Script>
          </>
        )}
        <AppConfigProvider>
          <AnalyticsProvider />
          <FontSetter />
          <ColorSetter />
          {children}
        </AppConfigProvider>
      </body>
    </html>
  );
}
