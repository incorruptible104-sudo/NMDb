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
