import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { absolutePublicFile, getMetadataBaseUrl } from "@/lib/site-url";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const ogImage = absolutePublicFile("/og-image.png");

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  title: "Design Resource Library",
  description:
    "A curated collection of design resources for designers and web coders.",
  icons: {
    icon: [{ url: absolutePublicFile("/icon.png"), type: "image/png", sizes: "32x32" }],
    shortcut: absolutePublicFile("/icon.png"),
    apple: absolutePublicFile("/apple-touch-icon.png"),
  },
  openGraph: {
    title: "Design Resource Library",
    description: "A curated collection of design resources for designers and web coders.",
    images: [{ url: ogImage, width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Design Resource Library",
    description: "A curated collection of design resources for designers and web coders.",
    images: [ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
