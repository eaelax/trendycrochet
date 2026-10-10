import type { Metadata } from 'next';
import { Shrikhand, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const shrikhand = Shrikhand({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-shrikhand',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trendy Crochet Patterns — Free Downloadable Modern Crochet Guides',
  description: 'Download modern, trendy crochet patterns in instant printable PDF format. 100% free downloadable guides.',
  openGraph: {
    title: 'Trendy Crochet Patterns — Free Downloadable Modern Crochet Guides',
    description: 'Download modern, trendy crochet patterns in instant printable PDF format.',
    type: 'website',
    images: [
      {
        url: '/images/hero-crochet.jpg',
        width: 1200,
        height: 675,
        alt: 'Trendy Crochet Patterns',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trendy Crochet Patterns — Free Downloadable Modern Crochet Guides',
    description: 'Download modern, trendy crochet patterns in instant printable PDF format.',
    images: ['/images/hero-crochet.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${shrikhand.variable} ${plusJakartaSans.variable}`}>
      <body
        className="min-h-screen bg-[#FAF5EC] text-[#2D1C17] font-sans antialiased selection:bg-[#E65F43]/15 selection:text-[#E65F43]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
