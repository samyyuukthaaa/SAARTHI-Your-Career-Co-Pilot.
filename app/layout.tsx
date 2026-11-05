import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saarathi — your career copilot",
  description:
    "Find jobs that fit, learn free in your language, and practise interviews in a room that feels real. Built for first-time coders in India.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#0F5C6E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Latin:wdth,wght@75..125,400..800&family=Anek+Devanagari:wdth,wght@75..125,400..800&family=Mukta:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
