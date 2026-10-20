import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PatternDetailClient from '@/components/PatternDetailClient';
import { getPatternBySlug } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    return {
      title: 'Pattern Not Found — Trendy Crochet Patterns',
      description: 'The requested crochet pattern could not be found.',
    };
  }

  const title = `${pattern.title} (FREE PDF) — Trendy Crochet Patterns`;
  const description = `Download ${pattern.title} free printable PDF crochet pattern guide (${pattern.pdf_size}). Instant download.`;
  const imageUrl = pattern.image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 1200,
          alt: pattern.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
    other: {
      'pinterest:image': imageUrl,
      'pinterest:title': title,
      'pinterest:description': description,
    },
  };
}

export default async function CrochetPatternPage({ params }: PageProps) {
  const { slug } = await params;
  const pattern = await getPatternBySlug(slug);

  if (!pattern) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <PatternDetailClient pattern={pattern} />
      </main>
      <Footer />
    </div>
  );
}
