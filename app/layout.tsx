import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trendy Crochet Patterns — Modern Handcrafted Crochet Guides',
  description: 'Download modern, trendy crochet patterns in instant printable PDF format. Handcrafted guides for makers everywhere.',
  openGraph: {
    title: 'Trendy Crochet Patterns — Modern Handcrafted Crochet Guides',
    description: 'Download modern, trendy crochet patterns in instant printable PDF format.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trendy Crochet Patterns — Modern Handcrafted Crochet Guides',
    description: 'Download modern, trendy crochet patterns in instant printable PDF format.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-white text-stone-900 font-sans antialiased selection:bg-stone-200 selection:text-stone-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
