import HomeClient from '@/components/HomeClient';
import Footer from '@/components/Footer';
import { getAllPatterns } from '@/lib/storage';

export const revalidate = 60;

export default async function HomePage() {
  const patterns = await getAllPatterns(true);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF5EC]">
      <main className="flex-1">
        <HomeClient initialPatterns={patterns} />
      </main>
      <Footer />
    </div>
  );
}
