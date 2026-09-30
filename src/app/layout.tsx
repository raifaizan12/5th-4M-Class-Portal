import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "5th-4M Class Portal",
  description: "Online attendance management portal for BS IT 5th-4M, The Islamia University of Bahawalpur.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<footer className="site-credit"> © 2026. All Rights Reserved. | Designed & Developed with ❤️. </footer></body>
    </html>
  );
}
