import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BestSellersClient from '@/components/BestSellersClient';
import { getAllPatterns } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BestSellersPage() {
  const allPatterns = await getAllPatterns(true);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <BestSellersClient initialPatterns={allPatterns} />
      <Footer />
    </div>
  );
}
