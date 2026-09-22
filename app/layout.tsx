import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";  
import { Analytics } from "@vercel/analytics/next";      

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NMDb — The Nollywood Movie Database",
    template: "%s — NMDb",
  },
  description:
    "NMDb is the Nollywood Movie Database — track box office numbers, cast and crew, streaming availability, trailers and news for Nigerian films.",
  metadataBase: new URL("https://www.nmdb.cc"),
  openGraph: {
    title: "NMDb — The Nollywood Movie Database",
    description:
      "Track box office numbers, cast and crew, streaming availability, trailers and news for Nigerian films.",
    url: "https://www.nmdb.cc",
    siteName: "NMDb",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NMDb — The Nollywood Movie Database",
    description:
      "Track box office numbers, cast and crew, streaming availability, trailers and news for Nigerian films.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Organization + WebSite structured data — helps Google recognize
            NMDb as a distinct entity and enables the sitelinks search box */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "NMDb",
                alternateName: "Nollywood Movie Database",
                url: "https://www.nmdb.cc",
                logo: "https://www.nmdb.cc/nmdb-logo.png",
                description:
                  "NMDb is the Nollywood Movie Database — tracking box office numbers, cast and crew, streaming availability, trailers and news for Nigerian films.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "NMDb",
                alternateName: "Nollywood Movie Database",
                url: "https://www.nmdb.cc",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://www.nmdb.cc/search?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />

        {/* Google AdSense — paste your code here */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3270819244736372"
          crossOrigin="anonymous"
        />

        {/* Google tag (gtag.js) — Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-PFHQ7N4J91"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-PFHQ7N4J91');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
  {children}
  <Analytics />
</body>
    </html>
  );
}
