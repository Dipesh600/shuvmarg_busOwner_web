import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Bus Operator Platform | Shuvmarg Partner",
  description:
    "Grow your bus business with Shuvmarg Partner — Nepal's #1 digital transit platform for fleet operators. Onboard your buses, automate bookings, and get weekly payouts.",
  keywords: [
    "bus operator Nepal",
    "Shuvmarg partner",
    "bus fleet onboarding",
    "Nepal online bus ticketing",
    "digital transport Nepal",
  ],
  openGraph: {
    title: "Bus Operator Platform | Shuvmarg Partner",
    description:
      "Join Nepal's largest digital transit booking network. 250+ operators onboarded. Weekly automated payouts.",
    type: "website",
    locale: "en_US",
    siteName: "Shuvmarg Partner",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect for Neue Machina font (hosted on passenger site) */}
        <link rel="preconnect" href="https://shuvmarg.vercel.app" />
        {/* Google Font Connections */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols Rounded — Icons */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
