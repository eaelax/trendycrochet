import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import AdminDashboard from '@/components/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Console — Trendy Crochet Patterns',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrendyCrochetAdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <main className="flex-1">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}
