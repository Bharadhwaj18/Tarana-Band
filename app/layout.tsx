import type { Metadata } from "next";
import "./globals.css";
import FaviconSetter from "@/components/FaviconSetter";

export const metadata: Metadata = {
  title: "Tarana",
  description: "Official website of Tarana rock band. Tours, merch, videos, and more.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Tarana - Rock Band",
    description: "Official website of Tarana rock band.",
    url: "https://tarana.band",
    type: "website",
  },
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
          href="https://fonts.googleapis.com/css2?family=Righteous&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Favicon with cache busting */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body className="font-body">
        <FaviconSetter />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                `,
              }}
            />
          </>
        )}
        {children}
      </body>
    </html>
  );
}

