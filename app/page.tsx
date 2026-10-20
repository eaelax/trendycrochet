import Navbar from '@/components/Navbar';
import HomeClient from '@/components/HomeClient';
import Footer from '@/components/Footer';
import { getAllPatterns } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const patterns = await getAllPatterns(true);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <HomeClient initialPatterns={patterns} />
      </main>
      <Footer />
    </div>
  );
}
