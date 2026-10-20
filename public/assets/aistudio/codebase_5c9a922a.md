# .aistudio\artifacts\brain\8d26e761-bbcf-464e-9250-a05aa4001534\.tempmediaStorage\media_1792510229641_c9d00fe5.png

This is a binary file of the type: Image

# .aistudio\artifacts\brain\8d26e761-bbcf-464e-9250-a05aa4001534\.tempmediaStorage\media_1792511098551_eba9921a.png

This is a binary file of the type: Image

# .aistudio\artifacts\brain\8d26e761-bbcf-464e-9250-a05aa4001534\.tempmediaStorage\media_1792512326942_46702302.png

This is a binary file of the type: Image

# .eslintrc.json

```json
{
  "extends": "next"
}

```

# .gitignore

```
node_modules/
.next/
coverage/
.DS_Store
*.log
.env*
!.env.example

```

# app\[slug]\page.tsx

```tsx
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

```

# app\api\admin\auth\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';

const EXPECTED_SECRET = process.env.ADMIN_SECRET_KEY || 'crochet2025';

export async function POST(req: NextRequest) {
  try {
    const { secretKey } = await req.json();

    if (!secretKey || secretKey.trim() !== EXPECTED_SECRET) {
      return NextResponse.json(
        { error: 'Invalid admin secret key' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
    });

    // Set HTTP-only cookie
    response.cookies.set('admin_auth_token', EXPECTED_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_auth_token')?.value;
  const isAuthenticated = Boolean(token && token === EXPECTED_SECRET);

  return NextResponse.json({
    authenticated: isAuthenticated,
    defaultKeyHint: !process.env.ADMIN_SECRET_KEY ? 'crochet2025' : undefined,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('admin_auth_token');
  return response;
}

```

# app\api\admin\patterns\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPatterns,
  createPattern,
  updatePattern,
  deletePattern,
  resetToDefaults,
} from '@/lib/storage';

const EXPECTED_SECRET = process.env.ADMIN_SECRET_KEY || 'crochet2025';

function checkAuth(req: NextRequest): boolean {
  const cookieToken = req.cookies.get('admin_auth_token')?.value;
  if (cookieToken && cookieToken === EXPECTED_SECRET) return true;

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.replace('Bearer ', '').trim() === EXPECTED_SECRET) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const patterns = await getAllPatterns(false);
  return NextResponse.json({ patterns });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.action === 'reset') {
      const resetList = await resetToDefaults();
      return NextResponse.json({ success: true, patterns: resetList });
    }

    if (body.action === 'sync' && Array.isArray(body.patterns)) {
      const { saveAllPatterns } = await import('@/lib/storage');
      const synced = await saveAllPatterns(body.patterns);
      return NextResponse.json({ success: true, patterns: synced });
    }

    if (!body.title || !body.cpa_locker_url) {
      return NextResponse.json(
        { error: 'Title and CPA Locker URL are required' },
        { status: 400 }
      );
    }

    const created = await createPattern({
      title: body.title,
      slug: body.slug,
      image_url: body.image_url || '/images/hero-crochet.jpg',
      pdf_size: body.pdf_size || '3.5 MB',
      difficulty_tag: body.difficulty_tag || 'Beginner Friendly',
      cpa_locker_url: body.cpa_locker_url,
      gumroad_url: body.gumroad_url || '',
      is_hot: Boolean(body.is_hot),
      is_best_seller: Boolean(body.is_best_seller),
      is_published: body.is_published ?? true,
      rating: body.rating !== undefined ? Number(body.rating) : 5,
      reviews_count: body.reviews_count !== undefined ? Number(body.reviews_count) : 128,
    });

    return NextResponse.json({ success: true, pattern: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating pattern:', error);
    return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Pattern ID is required' }, { status: 400 });
    }

    const updated = await updatePattern(body.id, {
      title: body.title,
      slug: body.slug,
      image_url: body.image_url,
      pdf_size: body.pdf_size,
      difficulty_tag: body.difficulty_tag,
      cpa_locker_url: body.cpa_locker_url,
      gumroad_url: body.gumroad_url,
      is_hot: body.is_hot,
      is_best_seller: body.is_best_seller !== undefined ? Boolean(body.is_best_seller) : undefined,
      is_published: body.is_published,
      rating: body.rating !== undefined ? Number(body.rating) : undefined,
      reviews_count: body.reviews_count !== undefined ? Number(body.reviews_count) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, pattern: updated });
  } catch (error) {
    console.error('Error updating pattern:', error);
    return NextResponse.json({ error: 'Failed to update pattern' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Pattern ID is required' }, { status: 400 });
    }

    const success = await deletePattern(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 });
  }
}

```

# app\api\patterns\[slug]\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getPatternBySlug } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const pattern = await getPatternBySlug(slug);

    if (!pattern) {
      return NextResponse.json(
        { error: 'Pattern not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ pattern });
  } catch (error) {
    console.error('Error fetching pattern by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pattern' },
      { status: 500 }
    );
  }
}

```

# app\api\patterns\route.ts

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getAllPatterns } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('q')?.toLowerCase();
    const all = searchParams.get('all') === 'true';

    let patterns = await getAllPatterns(!all);

    if (difficulty && difficulty !== 'All') {
      patterns = patterns.filter(
        (p) => p.difficulty_tag?.toLowerCase().includes(difficulty.toLowerCase())
      );
    }

    if (search) {
      patterns = patterns.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.size?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('Error in /api/patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}

```

# app\best-sellers\page.tsx

```tsx
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

```

# app\globals.css

```css
@import "tailwindcss";

:root {
  --bg-cream: #FAF9F5;
  --bg-mat: #F8F6F1;
  --color-primary: #1C1917;
  --color-wood: #D4C3AC;
}

body {
  background-color: #FFFFFF;
  color: #1C1917;
  font-family: var(--font-rubik), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

.font-serif, .font-serif-display, .font-sans {
  font-family: var(--font-rubik), system-ui, -apple-system, sans-serif !important;
}

```

# app\layout.tsx

```tsx
import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';

const rubik = Rubik({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-rubik',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Trendy Crochet Patterns — Modern Handcrafted Crochet Guides',
  description: 'Download modern, trendy crochet patterns in instant printable PDF format. Handcrafted guides for makers everywhere.',
  openGraph: {
    title: 'Trendy Crochet Patterns — Modern Handcrafted Crochet Guides',
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
    title: 'Trendy Crochet Patterns — Modern Handcrafted Crochet Guides',
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
    <html
      lang="en"
      className={`${rubik.variable}`}
    >
      <body
        className="min-h-screen bg-white text-stone-900 font-sans antialiased selection:bg-stone-200 selection:text-stone-900"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

```

# app\page.tsx

```tsx
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

```

# app\pattern\[slug]\page.tsx

```tsx
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LegacyPatternRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/${slug}`);
}

```

# app\trendycrochetpatternsadmin\page.tsx

```tsx
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

export default function HiddenAdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <main className="flex-1">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}

```

# components\AdminDashboard.tsx

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Check,
  Pin,
  Upload,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Eye,
  ShoppingBag,
  Save,
} from 'lucide-react';
import { Pattern } from '@/lib/types';
import { uploadImageToSupabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Patterns state
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [formError, setFormError] = useState('');

  // Delete Confirmation state
  const [deletingPattern, setDeletingPattern] = useState<Pattern | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPdfSize, setFormPdfSize] = useState('3.8 MB');
  const [formDifficultyTag, setFormDifficultyTag] = useState('Beginner Friendly');
  const [formCpaLockerUrl, setFormCpaLockerUrl] = useState('');
  const [formGumroadUrl, setFormGumroadUrl] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formReviewsCount, setFormReviewsCount] = useState(128);

  // File Upload
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPatterns = async () => {
    setIsLoadingPatterns(true);
    try {
      // Check localStorage first
      const saved = localStorage.getItem('trendy_crochet_patterns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPatterns(parsed);
          setIsLoadingPatterns(false);
          return;
        }
      }

      const res = await fetch('/api/admin/patterns');
      const data = await res.json();
      if (data.patterns) {
        setPatterns(data.patterns);
      }
    } catch (err) {
      console.error('Failed to load patterns:', err);
    } finally {
      setIsLoadingPatterns(false);
    }
  };

  // Check auth status on load
  useEffect(() => {
    let active = true;
    fetch('/api/admin/auth')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.authenticated) {
          setIsAuthenticated(true);
          fetchPatterns();
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: secretKeyInput }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        fetchPatterns();
      } else {
        setLoginError(data.error || 'Invalid secret key. Please try again.');
      }
    } catch {
      setLoginError('An error occurred during authentication.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
      setPatterns([]);
    } catch {
      setIsAuthenticated(false);
    }
  };

  // MANUAL SAVE BUTTON: Persists current dashboard patterns to localStorage and API
  const handleDashboardSave = async () => {
    try {
      localStorage.setItem('trendy_crochet_patterns', JSON.stringify(patterns));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('crochet_patterns_updated'));
      }
      
      // Also sync to server API
      await fetch('/api/admin/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', patterns }),
      }).catch(() => {});

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!editingPattern) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(autoSlug);
    }
  };

  const openCreateModal = () => {
    setEditingPattern(null);
    setFormTitle('');
    setFormSlug('');
    setFormImageUrl('/images/hero-crochet.jpg');
    setFormPdfSize('3.8 MB');
    setFormDifficultyTag('Beginner Friendly');
    setFormCpaLockerUrl('https://cpatracking.co/locker/pattern-download');
    setFormGumroadUrl('');
    setFormIsPublished(true);
    setFormIsBestSeller(false);
    setFormRating(5);
    setFormReviewsCount(128);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pattern) => {
    setEditingPattern(p);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormImageUrl(p.image_url);
    setFormPdfSize(p.pdf_size || '3.5 MB');
    setFormDifficultyTag(p.difficulty_tag || 'Beginner Friendly');
    setFormCpaLockerUrl(p.cpa_locker_url || '');
    setFormGumroadUrl(p.gumroad_url || '');
    setFormIsPublished(p.is_published);
    setFormIsBestSeller(Boolean(p.is_best_seller));
    setFormRating(p.rating ?? 5);
    setFormReviewsCount(p.reviews_count ?? 128);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      if (isSupabaseConfigured()) {
        const publicUrl = await uploadImageToSupabase(file);
        if (publicUrl) {
          setFormImageUrl(publicUrl);
          setIsUploadingImage(false);
          return;
        }
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormImageUrl(event.target.result as string);
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingImage(false);
    }
  };

  // Modal Save: Updates local dashboard state ONLY (no auto-persist until "Save Changes" is clicked)
  const handleSavePattern = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formTitle.trim()) {
      setFormError('Pattern title is required.');
      return;
    }
    if (!formCpaLockerUrl.trim()) {
      setFormError('CPA Locker URL is required.');
      return;
    }

    const baseSlug = formSlug.trim() || formTitle.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

    if (editingPattern) {
      // Edit existing pattern in local state
      const updated = patterns.map((p) =>
        p.id === editingPattern.id
          ? {
              ...p,
              title: formTitle.trim(),
              slug: baseSlug,
              image_url: formImageUrl.trim() || '/images/hero-crochet.jpg',
              pdf_size: formPdfSize.trim() || '3.5 MB',
              difficulty_tag: formDifficultyTag.trim() || 'Beginner Friendly',
              cpa_locker_url: formCpaLockerUrl.trim(),
              gumroad_url: formGumroadUrl.trim(),
              is_published: formIsPublished,
              is_best_seller: formIsBestSeller,
              rating: Number(formRating) || 5,
              reviews_count: Number(formReviewsCount) || 128,
            }
          : p
      );
      setPatterns(updated);
    } else {
      // Add new pattern to local state
      const newPattern: Pattern = {
        id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim(),
        slug: baseSlug,
        image_url: formImageUrl.trim() || '/images/hero-crochet.jpg',
        pdf_size: formPdfSize.trim() || '3.5 MB',
        difficulty_tag: formDifficultyTag.trim() || 'Beginner Friendly',
        cpa_locker_url: formCpaLockerUrl.trim(),
        gumroad_url: formGumroadUrl.trim(),
        is_published: formIsPublished,
        is_best_seller: formIsBestSeller,
        rating: Number(formRating) || 5,
        reviews_count: Number(formReviewsCount) || 128,
        created_at: new Date().toISOString(),
        description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
      };
      setPatterns([newPattern, ...patterns]);
    }

    setIsModalOpen(false);
  };

  // Delete: Updates local dashboard state ONLY until "Save Changes" is clicked
  const handleDeletePattern = () => {
    if (!deletingPattern) return;
    const filtered = patterns.filter((p) => p.id !== deletingPattern.id);
    setPatterns(filtered);
    setDeletingPattern(null);
  };

  const handleResetSamplePatterns = async () => {
    if (!confirm('Reset all patterns to sample patterns?')) return;
    try {
      const res = await fetch('/api/admin/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (res.ok && data.patterns) {
        setPatterns(data.patterns);
        localStorage.removeItem('trendy_crochet_patterns');
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const copyPinterestLink = async (p: Pattern) => {
    if (typeof window !== 'undefined') {
      const pageUrl = `${window.location.origin}/${p.slug}`;
      const mediaUrl = p.image_url.startsWith('http')
        ? p.image_url
        : `${window.location.origin}${p.image_url}`;
      const pinShareUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
        pageUrl
      )}&media=${encodeURIComponent(
        mediaUrl
      )}&description=${encodeURIComponent(
        `${p.title} - Free Crochet Pattern PDF Guide!`
      )}`;

      try {
        await navigator.clipboard.writeText(pinShareUrl);
        setCopiedId(p.id);
        setTimeout(() => setCopiedId(null), 2500);
      } catch {
        // fallback
      }
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-stone-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-[#E65F43]" />
          <span>Verifying access...</span>
        </div>
      </div>
    );
  }

  // Secret Key Login Gate (Passcode hint removed)
  if (!isAuthenticated) {
    return (
      <div className="py-20 px-4 max-w-sm mx-auto">
        <div className="bg-white rounded-xl border border-stone-200 p-8">
          <div className="w-10 h-10 rounded-full bg-[#E65F43]/10 text-[#E65F43] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>

          <h1 className="text-xl font-bold text-[#2D1C17] text-center mb-1">
            Admin Authentication
          </h1>
          <p className="text-xs text-stone-500 text-center mb-6">
            Enter your admin secret key to access the management portal.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Secret Key
              </label>
              <input
                type="password"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                placeholder="Enter secret key..."
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                required
              />
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full py-2.5 bg-[#E65F43] hover:bg-[#c94934] text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingLogin ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Unlock Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {saveSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-none">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Changes successfully saved! Your website home page has been updated.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#2D1C17] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to site</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1C17]">
            Pattern Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Click <strong className="text-[#49B8BE]">Save Changes</strong> to apply your edits to the live website.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDashboardSave}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#E5A914] hover:bg-[#d0950a] text-stone-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-none"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            <span>Save Changes</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Pattern</span>
          </button>

          <button
            onClick={handleResetSamplePatterns}
            title="Reset to default sample patterns"
            className="p-2 text-stone-500 hover:text-[#2D1C17] bg-white border border-stone-200 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2 text-stone-500 hover:text-red-600 bg-white border border-stone-200 rounded-lg cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pattern List Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
          <span className="font-bold text-xs text-[#2D1C17]">
            Active Patterns ({patterns.length})
          </span>
        </div>

        {isLoadingPatterns ? (
          <div className="p-10 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#E65F43]" />
            <span>Loading patterns...</span>
          </div>
        ) : patterns.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-500">
            No patterns currently found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#2D1C17]">
              <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pattern</th>
                  <th className="py-3 px-4">Rating & Reviews</th>
                  <th className="py-3 px-4">PDF Size</th>
                  <th className="py-3 px-4">Difficulty Tag</th>
                  <th className="py-3 px-4">CPA & Gumroad Links</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="bg-white">
                    {/* Pattern title & image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <Image
                            src={pattern.image_url || '/images/hero-crochet.jpg'}
                            alt={pattern.title}
                            fill
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/${pattern.slug}`}
                            target="_blank"
                            className="font-bold text-[#2D1C17] truncate block max-w-xs"
                          >
                            {pattern.title}
                          </Link>
                          <span className="text-[11px] text-stone-400 font-mono truncate block">
                            /{pattern.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rating & Reviews */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-xs text-stone-800">
                        <span className="text-amber-500 text-sm">★</span>
                        <span>{pattern.rating ?? 5}</span>
                        <span className="text-stone-400 font-normal">({pattern.reviews_count ?? 128})</span>
                      </div>
                    </td>

                    {/* PDF Size */}
                    <td className="py-3 px-4 font-mono text-stone-600 font-medium">
                      {pattern.pdf_size || '3.5 MB'}
                    </td>

                    {/* Difficulty Tag */}
                    <td className="py-3 px-4">
                      <span className="bg-[#BF8CE3]/20 text-[#7D3EAB] font-bold text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap">
                        {pattern.difficulty_tag || 'Beginner Friendly'}
                      </span>
                    </td>

                    {/* CPA & Gumroad URLs */}
                    <td className="py-3 px-4 max-w-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-500">
                        <span className="truncate">CPA: {pattern.cpa_locker_url}</span>
                        <a
                          href={pattern.cpa_locker_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Test CPA link"
                          className="text-stone-400 hover:text-[#E65F43] shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {pattern.gumroad_url && (
                        <div className="flex items-center gap-1 font-mono text-[10px] text-stone-500">
                          <ShoppingBag className="w-2.5 h-2.5 text-[#2D1C17]" />
                          <span className="truncate text-stone-600">{pattern.gumroad_url}</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => copyPinterestLink(pattern)}
                          title="Copy Pinterest Pin link"
                          className="px-2 py-1 text-[11px] font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === pattern.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Pin className="w-3 h-3 text-stone-400" />
                              <span>Pin Link</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/${pattern.slug}`}
                          target="_blank"
                          title="Preview"
                          className="p-1 text-stone-400 hover:text-stone-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => openEditModal(pattern)}
                          title="Edit"
                          className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingPattern(pattern)}
                          title="Delete"
                          className="p-1 text-stone-400 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-stone-200 max-w-lg w-full p-6 my-8 relative">
            <h2 className="text-lg font-bold text-[#2D1C17] mb-1">
              {editingPattern ? 'Edit Pattern' : 'Add New Pattern'}
            </h2>
            <p className="text-xs text-stone-500 mb-5">
              Enter the pattern details and click &quot;Save Changes&quot; on the dashboard to publish.
            </p>

            {formError && (
              <div className="p-2.5 mb-4 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePattern} className="space-y-4 text-xs">
              {/* 1. Title */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Pattern Title *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Chunky Strawberry Cardigan"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                  required
                />
                <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                  Slug: /{formSlug || 'auto-generated'}
                </span>
              </div>

              {/* 2. Image URL */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Image URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://... or /images/..."
                    className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                    required
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {isUploadingImage ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. PDF File Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    PDF File Size (e.g. &quot;3.8 MB&quot;) *
                  </label>
                  <input
                    type="text"
                    value={formPdfSize}
                    onChange={(e) => setFormPdfSize(e.target.value)}
                    placeholder="e.g. 3.8 MB"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                    required
                  />
                </div>

                {/* 4. Difficulty Tag */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Difficulty Tag *
                  </label>
                  <input
                    type="text"
                    value={formDifficultyTag}
                    onChange={(e) => setFormDifficultyTag(e.target.value)}
                    placeholder="Beginner Friendly"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                    required
                  />
                </div>
              </div>

              {/* 5. Rating & Reviews Count (Editable from Dashboard) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Star Rating (1.0 to 5.0) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formRating}
                    onChange={(e) => setFormRating(parseFloat(e.target.value) || 5)}
                    placeholder="5.0"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                    required
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Controls star display (e.g. ★★★★★)
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Reviews Count (e.g. 128) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formReviewsCount}
                    onChange={(e) => setFormReviewsCount(parseInt(e.target.value, 10) || 0)}
                    placeholder="128"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                    required
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Shows review count in brackets (128)
                  </span>
                </div>
              </div>

              {/* 5. CPA Locker URL */}
              <div>
                <label className="block font-bold text-[#E65F43] mb-1">
                  CPA Locker URL (Required) *
                </label>
                <input
                  type="url"
                  value={formCpaLockerUrl}
                  onChange={(e) => setFormCpaLockerUrl(e.target.value)}
                  placeholder="https://your-cpa-network.com/locker/pattern-id"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                  required
                />
              </div>

              {/* 6. Gumroad URL (Optional) */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Gumroad Direct Purchase URL (Optional)
                </label>
                <input
                  type="url"
                  value={formGumroadUrl}
                  onChange={(e) => setFormGumroadUrl(e.target.value)}
                  placeholder="https://gumroad.com/l/your-pattern-slug"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Enables the secondary &quot;BUY IT NOW&quot; button.
                </span>
              </div>

              {/* 7. Best Seller Setting Checkbox */}
              <div className="flex items-center gap-2.5 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="modal-is-best-seller"
                  checked={formIsBestSeller}
                  onChange={(e) => setFormIsBestSeller(e.target.checked)}
                  className="w-4 h-4 text-[#E65F43] rounded border-stone-300 focus:ring-[#E65F43] cursor-pointer"
                />
                <label htmlFor="modal-is-best-seller" className="font-bold text-stone-900 text-xs cursor-pointer select-none">
                  Mark as Best Seller (Show in Best Sellers page &amp; badge)
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-stone-600 hover:text-stone-900 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E65F43] hover:bg-[#c94934] text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  {editingPattern ? 'Update in List' : 'Add to List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPattern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-stone-200 max-w-sm w-full p-6 text-center">
            <h3 className="text-base font-bold text-[#2D1C17] mb-2">
              Delete Pattern?
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Are you sure you want to delete &ldquo;{deletingPattern.title}&rdquo;?
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeletingPattern(null)}
                className="px-3.5 py-2 text-stone-600 font-semibold text-xs rounded-lg border border-stone-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePattern}
                className="px-3.5 py-2 bg-[#E65F43] text-white font-bold text-xs rounded-lg hover:bg-[#c94934] cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

```

# components\BestSellersClient.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import PatternCard from '@/components/PatternCard';
import Link from 'next/link';

interface BestSellersClientProps {
  initialPatterns: Pattern[];
}

export default function BestSellersClient({ initialPatterns }: BestSellersClientProps) {
  const [patterns, setPatterns] = useState<Pattern[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = initialPatterns.map(init => {
              const found = parsed.find((p: Pattern) => p.id === init.id);
              return found ? { ...init, ...found } : init;
            });
            const custom = parsed.filter((p: Pattern) => !initialPatterns.some(init => init.id === p.id));
            return [...merged, ...custom];
          }
        }
      } catch {
        // fallback
      }
    }
    return initialPatterns;
  });

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const merged = initialPatterns.map(init => {
              const found = parsed.find((p: Pattern) => p.id === init.id);
              return found ? { ...init, ...found } : init;
            });
            const custom = parsed.filter((p: Pattern) => !initialPatterns.some(init => init.id === p.id));
            setPatterns([...merged, ...custom]);
          }
        }
      } catch {
        // ignore
      }
    };

    syncFromStorage();

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('crochet_patterns_updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('crochet_patterns_updated', syncFromStorage);
    };
  }, [initialPatterns]);

  const bestSellers = patterns.filter((p) => p.is_best_seller);

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 w-full">
      <div className="mb-8 text-center">
        <span className="text-xs uppercase tracking-widest text-[#E65F43] font-bold block mb-2">
          Curated Collection
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 mb-3">
          Best Sellers
        </h1>
        <p className="text-xs sm:text-sm text-stone-700 max-w-lg mx-auto font-bold">
          Explore our community-favorite crochet patterns with top-rated printable PDF guides.
        </p>
      </div>

      {bestSellers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
          {bestSellers.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-stone-500">
          <p className="font-serif text-lg font-bold mb-2">No best sellers designated yet.</p>
          <p className="text-xs text-stone-600 font-bold mb-4">Mark patterns as Best Sellers in the Admin Dashboard settings.</p>
          <Link
            href="/trendycrochetpatternsadmin"
            className="inline-block px-5 py-2.5 bg-[#E65F43] text-white text-xs font-extrabold rounded-xl shadow-xs"
          >
            Open Admin Dashboard
          </Link>
        </div>
      )}
    </main>
  );
}

```

# components\DownloadSteps.tsx

```tsx
'use client';

export default function DownloadSteps() {
  return (
    <section id="steps" className="w-full max-w-7xl mx-auto my-12 px-4 sm:px-6 md:px-8">
      <div className="bg-[#F8F6F1] border border-stone-200/60 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
        <div className="text-center max-w-lg mx-auto mb-10">
          <span className="text-xs uppercase tracking-wider text-stone-500 font-medium block mb-1">
            Free Printable Guides
          </span>
          <h3 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-tight">
            How to get your free patterns
          </h3>
          <p className="text-xs sm:text-sm text-stone-500 mt-2 font-normal leading-relaxed">
            Every pattern in our gallery is 100% free with complete photo instructions and stitch counts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Step 1 */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200/60 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-2xl font-bold text-stone-900 block mb-2 font-serif">
                01
              </span>
              <h4 className="text-sm font-semibold text-stone-900 mb-1.5">
                Select Your Pattern
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Choose any framed design from our Best Sellers or Latest Arrivals and click &ldquo;Download Guide&rdquo;.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200/60 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-2xl font-bold text-stone-900 block mb-2 font-serif">
                02
              </span>
              <h4 className="text-sm font-semibold text-stone-900 mb-1.5">
                Quick 30-Sec Verification
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Complete a brief, free sponsor task to instantly unlock your secure PDF download access.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 sm:p-7 rounded-xl border border-stone-200/60 flex flex-col justify-between shadow-xs">
            <div>
              <span className="text-2xl font-bold text-stone-900 block mb-2 font-serif">
                03
              </span>
              <h4 className="text-sm font-semibold text-stone-900 mb-1.5">
                Instant PDF Download
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Your full pattern PDF guide downloads directly to your device ready to print or view on your phone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

```

# components\Footer.tsx

```tsx
'use client';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-100 bg-white text-stone-500 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center space-y-3">
        <p className="text-sm font-bold tracking-[0.2em] uppercase text-stone-900 font-sans">
          TRENDY CROCHET
        </p>
        <p className="text-stone-500 text-xs font-normal max-w-md mx-auto">
          Your source for wall-worthy, wearable crochet art patterns and instant printable PDF guides.
        </p>
        <p className="text-stone-400 text-[11px] font-normal pt-2">
          © {new Date().getFullYear()} Trendy Crochet. 100% Free Instant Downloads.
        </p>
      </div>
    </footer>
  );
}

```

# components\HeroBanner.tsx

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, Printer, Search, X } from 'lucide-react';
import { Pattern } from '@/lib/types';

interface HeroBannerProps {
  featuredPattern?: Pattern;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function HeroBanner({
  searchQuery,
  onSearchChange,
}: HeroBannerProps) {
  return (
    <section className="w-full pt-4 pb-12 sm:pb-16 px-4 sm:px-6 md:px-8 bg-white">
      {/* 1. Main Hero Container with one image covering the whole container */}
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
          {/* Single image covering the entire container */}
          <Image
            src="/images/hero_crochet_retro_1791554627877.jpg"
            alt="Crochet Art"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          {/* Scroll CTA */}
          <div className="absolute bottom-6 left-0 w-full text-center z-10">
            <span className="text-white text-sm font-bold bg-[#222222] px-5 py-2 rounded-full shadow-lg border border-white/30">
              Scroll down to view patterns ↓
            </span>
          </div>
        </div>

        {/* 2. Four Trust Badges below Hero matching screenshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pt-10 sm:pt-14 pb-4 px-2 sm:px-4 text-center">
          {/* Badge 1 */}
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
              100% Free access
            </h4>
          </div>

          {/* Badge 2 */}
          <div className="flex flex-col items-center">
            <Heart className="w-6 h-6 text-rose-500 mb-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
              Beginner friendly
            </h4>
          </div>

          {/* Badge 3 */}
          <div className="flex flex-col items-center">
            <Sparkles className="w-6 h-6 text-amber-500 mb-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
              Tested stitch quality
            </h4>
          </div>

          {/* Badge 4 */}
          <div className="flex flex-col items-center">
            <Printer className="w-6 h-6 text-sky-600 mb-2" />
            <h4 className="text-xs sm:text-sm font-semibold text-stone-900">
              Printable PDF
            </h4>
          </div>
        </div>

        {/* 3. Search Bar for filtering */}
        <div id="search" className="pt-2 sm:pt-4 max-w-md mx-auto px-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search patterns (cardigan, tote bag, floral, plushie)..."
              className="w-full pl-11 pr-10 py-3.5 bg-white border-2 border-stone-300 rounded-full text-sm text-stone-900 placeholder:text-stone-500 focus:outline-none focus:border-[#E65F43] shadow-md"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

```

# components\HomeClient.tsx

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Pattern } from '@/lib/types';
import HeroBanner from './HeroBanner';
import PatternGrid from './PatternGrid';
import DownloadSteps from './DownloadSteps';

interface HomeClientProps {
  initialPatterns: Pattern[];
}

export default function HomeClient({ initialPatterns }: HomeClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [patterns, setPatterns] = useState<Pattern[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Merge initialPatterns with saved to ensure new properties like is_best_seller exist
            const merged = initialPatterns.map(init => {
              const found = parsed.find((p: Pattern) => p.id === init.id);
              return found ? { ...init, ...found } : init;
            });
            const custom = parsed.filter((p: Pattern) => !initialPatterns.some(init => init.id === p.id));
            return [...merged, ...custom];
          }
        }
      } catch {
        // fallback
      }
    }
    return initialPatterns;
  });

  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const merged = initialPatterns.map(init => {
              const found = parsed.find((p: Pattern) => p.id === init.id);
              return found ? { ...init, ...found } : init;
            });
            const custom = parsed.filter((p: Pattern) => !initialPatterns.some(init => init.id === p.id));
            setPatterns([...merged, ...custom]);
          }
        }
      } catch {
        // ignore
      }
    };

    syncFromStorage();

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('crochet_patterns_updated', syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('crochet_patterns_updated', syncFromStorage);
    };
  }, [initialPatterns]);

  return (
    <>
      <HeroBanner
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <PatternGrid
        patterns={patterns}
        searchQuery={searchQuery}
        onResetSearch={() => setSearchQuery('')}
      />

      {/* 3-Step Guide Section on Home Page */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-16">
        <DownloadSteps />
      </div>
    </>
  );
}

```

# components\Navbar.tsx

```tsx
'use client';

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="w-full bg-white sticky top-0 z-40 border-b border-stone-100">
      {/* Top Announcement Bar */}
      <div className="w-full bg-[#EBE7DF] text-stone-800 py-1.5 px-4 text-center text-[10px] sm:text-[11px] font-medium tracking-wide">
        <span>100% Free Instant Downloads · Verified Printable PDF Guides</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 sm:h-20 grid grid-cols-3 items-center">
        {/* Left Side: Pattern, Best sellers */}
        <nav className="flex items-center gap-4 sm:gap-6 text-xs text-stone-900 font-medium tracking-normal">
          <Link href="/#patterns" className="text-stone-900 font-normal">
            Pattern
          </Link>
          <Link href="/best-sellers" className="text-stone-900 font-normal">
            Best sellers
          </Link>
        </nav>

        {/* Middle: Site Name (Bold) */}
        <div className="text-center">
          <Link
            href="/"
            className="text-base sm:text-xl md:text-2xl font-extrabold tracking-[0.2em] uppercase text-stone-900 font-sans select-none"
          >
            TRENDY CROCHET
          </Link>
        </div>

        {/* Right Side: Latest arrivals, How it works */}
        <nav className="flex items-center justify-end gap-4 sm:gap-6 text-xs text-stone-900 font-medium tracking-normal">
          <Link href="/#patterns" className="text-stone-900 font-normal">
            Latest arrivals
          </Link>
          <Link href="/#steps" className="text-stone-900 font-normal">
            How it works
          </Link>
        </nav>
      </div>
    </header>
  );
}

```

# components\PatternCard.tsx

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Download, Star, FileText } from 'lucide-react';
import { Pattern } from '@/lib/types';

interface PatternCardProps {
  pattern: Pattern;
}

export default function PatternCard({ pattern }: PatternCardProps) {
  const [imageError, setImageError] = useState(false);

  const displayImage = imageError
    ? '/images/hero-crochet.jpg'
    : (pattern.image_url || '/images/hero-crochet.jpg');

  // Dynamic reviews count and star rating from dashboard
  const ratingVal = Math.min(5, Math.max(1, Math.round(pattern.rating ?? 5)));
  const reviewCount = pattern.reviews_count ?? 128;

  return (
    <div className="flex flex-col h-full bg-white p-3 sm:p-3.5 rounded-2xl border border-stone-200/70 shadow-xs relative">
      {/* 1. Square pattern image covering the whole image container */}
      <Link
        href={`/${pattern.slug}`}
        className="block relative w-full aspect-square rounded-xl overflow-hidden bg-stone-100"
      >
        <Image
          src={displayImage}
          alt={pattern.title}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          referrerPolicy="no-referrer"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {pattern.is_best_seller && (
          <span className="absolute top-2.5 left-2.5 bg-[#E65F43] text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm z-10">
            Best Seller
          </span>
        )}
      </Link>

      {/* 2. Metadata beneath the image */}
      <div className="pt-3 flex flex-col flex-1 justify-between">
        <div>
          {/* Row 1: Title */}
          <Link href={`/${pattern.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-normal text-stone-900 line-clamp-1">
              {pattern.title}
            </h3>
          </Link>

          {/* Row 2: Centered and highly visible FREE & old price */}
          <div className="text-sm sm:text-base font-normal text-stone-900 mt-2 mb-1 flex items-center justify-center gap-2">
            <span className="text-[#E65F43] bg-[#E65F43]/10 px-2 py-0.5 rounded text-xs sm:text-sm font-bold uppercase tracking-wide">FREE</span>
            <span className="line-through text-stone-400 text-xs sm:text-sm font-normal">$2.00</span>
          </div>

          {/* Row 3: Rating (Amber), Size (Indigo), and Downloads (Emerald) with distinct colored icons */}
          {(() => {
            let hash = 0;
            for (let i = 0; i < pattern.id.length; i++) {
              hash = (hash << 5) - hash + pattern.id.charCodeAt(i);
              hash |= 0;
            }
            const downloadsCount = 20 + Math.abs(hash) % 81;
            return (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-900 font-normal mt-1 flex-wrap">
                {/* Rating with Amber Star */}
                <span className="flex items-center gap-0.5 text-stone-800">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{pattern.rating ?? 5}</span>
                  <span className="text-stone-400 text-[10px]">({reviewCount})</span>
                </span>
                <span className="text-stone-300">·</span>
                {/* Size with Indigo FileText */}
                <span className="flex items-center gap-0.5 text-stone-700">
                  <FileText className="w-3 h-3 text-indigo-600" />
                  <span>{pattern.pdf_size || '3.5 MB'}</span>
                </span>
                <span className="text-stone-300">·</span>
                {/* Downloads with Emerald Download */}
                <span className="flex items-center gap-0.5 text-emerald-700 font-normal">
                  <Download className="w-3 h-3 text-emerald-600" />
                  <span>{downloadsCount} downloads</span>
                </span>
              </div>
            );
          })()}
        </div>

        {/* Row 4: Dedicated DOWNLOAD Button */}
        <div className="pt-3 mt-1">
          <Link
            href={`/${pattern.slug}`}
            className="w-full py-3.5 px-3 bg-[#E65F43] hover:bg-[#d04e33] text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 stroke-[3]" />
            <span>GET PATTERN NOW</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

```

# components\PatternDetailClient.tsx

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, FileText, CheckCircle2, Download, Star } from 'lucide-react';
import { Pattern } from '@/lib/types';
import DownloadSteps from './DownloadSteps';

interface PatternDetailClientProps {
  pattern: Pattern;
}

export default function PatternDetailClient({ pattern }: PatternDetailClientProps) {
  const [imageError, setImageError] = useState(false);

  const displayImage = imageError
    ? '/images/hero-crochet.jpg'
    : (pattern.image_url || '/images/hero-crochet.jpg');

  // Dynamic reviews count and star rating from dashboard
  const ratingVal = Math.min(5, Math.max(1, Math.round(pattern.rating ?? 5)));
  const reviewCount = pattern.reviews_count ?? 128;

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* Back navigation */}
      <div className="mb-4 sm:mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to patterns</span>
        </Link>
      </div>

      {/* 2-Column Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start max-w-5xl mx-auto">
        {/* LEFT COLUMN: Pattern image covering the whole image container directly */}
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/60">
          <Image
            src={displayImage}
            alt={pattern.title}
            fill
            priority
            className="object-cover"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* RIGHT COLUMN: Pattern details & download action */}
        <div className="flex flex-col h-full gap-6">
          <div>
            {/* 1. Category & Difficulty Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-normal uppercase tracking-wider text-stone-700">
                {pattern.difficulty_tag || 'Beginner Friendly'}
              </span>
              <span className="text-stone-300">·</span>
              <span className="text-xs font-normal text-stone-600">
                Printable PDF Guide
              </span>
            </div>

            {/* 2. Title */}
            <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 leading-tight mb-3 font-normal">
              {pattern.title}
            </h1>

            {/* 3. Rating (Amber), Size (Indigo) & Downloads (Emerald) with distinct colored icons */}
            {(() => {
              let hash = 0;
              for (let i = 0; i < pattern.id.length; i++) {
                hash = (hash << 5) - hash + pattern.id.charCodeAt(i);
                hash |= 0;
              }
              const downloadsCount = 20 + Math.abs(hash) % 81;
              return (
                <div className="flex items-center gap-2 mb-4 text-xs font-normal text-stone-900 flex-wrap">
                  {/* Rating with Amber Star */}
                  <span className="flex items-center gap-1 text-stone-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{pattern.rating ?? 5}</span>
                    <span className="text-stone-500">({reviewCount} reviews)</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  {/* Size with Indigo FileText */}
                  <span className="flex items-center gap-1 text-stone-700">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{pattern.pdf_size || '3.5 MB'}</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  {/* Downloads with Emerald Download */}
                  <span className="flex items-center gap-1 text-emerald-700 font-normal">
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{downloadsCount} downloads</span>
                  </span>
                </div>
              );
            })()}

            {/* 4. Centered FREE & old price banner with smaller text */}
            <div className="bg-[#FAF6F0] border border-stone-200/70 rounded-2xl p-3.5 mb-6 flex items-center justify-center text-center shadow-xs">
              <div className="flex items-center justify-center gap-2.5">
                <span className="text-xl sm:text-2xl font-extrabold text-[#E65F43] tracking-wide">FREE</span>
                <span className="line-through text-stone-400 text-sm sm:text-base font-normal">$2.00</span>
              </div>
            </div>

            {/* 5. Specs Box */}
            <div className="bg-[#F8F6F1] border border-stone-200/60 rounded-xl p-4 space-y-2.5 text-xs sm:text-sm text-stone-700 font-normal mb-5">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Format</span>
                <span className="font-normal text-stone-900">High-Res Printable PDF</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-200/50 pt-2">
                <span className="text-stone-600">File Size</span>
                <span className="font-normal text-stone-900 font-mono">{pattern.pdf_size}</span>
              </div>
              <div className="flex justify-between items-center border-t border-stone-200/50 pt-2">
                <span className="text-stone-600">Instant Access</span>
                <span className="font-normal text-[#E65F43]">✓ Free Instant Unlock</span>
              </div>
            </div>

            {/* 6. Description */}
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-6 font-normal">
              {pattern.description ||
                'Download the full printable PDF pattern with exact stitch counts, step-by-step instructions, and photo tutorial.'}
            </p>
          </div>

          {/* 7. CTAs without hover effects */}
          <div className="space-y-3 pt-2">
            <div>
              <a
                href={pattern.cpa_locker_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#222222] text-white font-medium py-3.5 px-6 rounded-full text-center block text-sm tracking-wide shadow-sm"
              >
                FREE DOWNLOAD NOW
              </a>
              <p className="text-[11px] text-stone-600 text-center mt-1.5 font-normal">
                Instant access unlocked after completing a quick 30-sec verification
              </p>
            </div>

            {pattern.gumroad_url && (
              <div>
                <a
                  href={pattern.gumroad_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#E65F43] text-white font-bold py-3 px-6 rounded-full text-center block text-xs sm:text-sm tracking-wide"
                >
                  BUY IT NOW $2.00
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3-Step Guide Section directly below */}
      <div className="mt-8">
        <DownloadSteps />
      </div>
    </div>
  );
}

```

# components\PatternGrid.tsx

```tsx
'use client';

import { useMemo } from 'react';
import { Pattern } from '@/lib/types';
import PatternCard from './PatternCard';

interface PatternGridProps {
  patterns: Pattern[];
  searchQuery: string;
  onResetSearch?: () => void;
}

export default function PatternGrid({
  patterns,
  searchQuery,
  onResetSearch,
}: PatternGridProps) {
  const filteredPatterns = useMemo(() => {
    if (!searchQuery.trim()) return patterns;
    const query = searchQuery.toLowerCase();
    return patterns.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.difficulty_tag?.toLowerCase().includes(query) ||
        p.pdf_size?.toLowerCase().includes(query)
    );
  }, [patterns, searchQuery]);

  return (
    <div id="patterns" className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-0 pb-6">
      {/* If Search is Active */}
      {searchQuery.trim() && (
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-6">
          <span className="text-xs text-stone-500 font-medium">
            Search results for &ldquo;{searchQuery}&rdquo; ({filteredPatterns.length})
          </span>
          {onResetSearch && (
            <button
              onClick={onResetSearch}
              className="text-xs text-stone-700 underline"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Grid of all crochet patterns directly */}
      {filteredPatterns.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
          {filteredPatterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-stone-500">
          <p className="font-serif text-lg mb-2">No patterns found matching &ldquo;{searchQuery}&rdquo;.</p>
          {onResetSearch && (
            <button
              onClick={onResetSearch}
              className="text-xs font-semibold uppercase tracking-wider text-stone-900 underline"
            >
              View all patterns
            </button>
          )}
        </div>
      )}
    </div>
  );
}

```

# eslint.config.mjs

```mjs
import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    extends: [...next],
}]);

```

# hooks\use-mobile.ts

```ts
'use client';

import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const subscribe = React.useCallback((callback: () => void) => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  }, []);

  const getSnapshot = () => {
    return window.innerWidth < MOBILE_BREAKPOINT;
  };

  const getServerSnapshot = () => false;

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

```

# lib\initial-data.ts

```ts
import { Pattern } from './types';

export const INITIAL_PATTERNS: Pattern[] = [
  {
    id: 'pat-001',
    title: 'Chunky Strawberry Statement Cardigan',
    slug: 'chunky-strawberry-statement-cardigan',
    image_url: '/images/strawberry-cardigan.jpg',
    pdf_size: '4.8 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/strawberry-cardigan',
    gumroad_url: 'https://gumroad.com/l/strawberry-cardigan-pattern',
    is_hot: true,
    is_best_seller: true,
    is_published: true,
    created_at: '2025-01-10T10:00:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
  {
    id: 'pat-002',
    title: 'Retro Daisy Granny Square Market Tote',
    slug: 'retro-daisy-granny-square-market-tote',
    image_url: '/images/daisy-granny-bag.jpg',
    pdf_size: '3.4 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/daisy-granny-tote',
    gumroad_url: 'https://gumroad.com/l/daisy-granny-tote-pattern',
    is_hot: true,
    is_best_seller: true,
    is_published: true,
    created_at: '2025-01-12T14:30:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
  {
    id: 'pat-003',
    title: 'Toadstool Mushroom Cottagecore Bucket Hat',
    slug: 'toadstool-mushroom-cottagecore-bucket-hat',
    image_url: '/images/mushroom-bucket-hat.jpg',
    pdf_size: '2.9 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/toadstool-mushroom-hat',
    gumroad_url: 'https://gumroad.com/l/mushroom-bucket-hat-pattern',
    is_hot: true,
    is_best_seller: true,
    is_published: true,
    created_at: '2025-01-14T09:15:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
  {
    id: 'pat-004',
    title: 'Modern Checkered Mug Rugs & Coasters',
    slug: 'modern-checkered-mug-rugs-and-coasters',
    image_url: '/images/checkered-mug-rugs.jpg',
    pdf_size: '2.1 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/checkered-mug-rug',
    gumroad_url: 'https://gumroad.com/l/checkered-mug-rug-pattern',
    is_hot: false,
    is_published: true,
    created_at: '2025-01-16T11:00:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
  {
    id: 'pat-005',
    title: 'Coquette Ribbon-Tie Halter Top',
    slug: 'coquette-ribbon-tie-halter-top',
    image_url: '/images/coquette-halter-top.jpg',
    pdf_size: '3.8 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/coquette-halter-top',
    gumroad_url: 'https://gumroad.com/l/coquette-halter-top-pattern',
    is_hot: false,
    is_published: true,
    created_at: '2025-01-18T16:45:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
  {
    id: 'pat-006',
    title: 'Vintage Sunset Ripple Throw Blanket',
    slug: 'vintage-sunset-ripple-throw-blanket',
    image_url: '/images/sunset-ripple-throw.jpg',
    pdf_size: '5.2 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/sunset-ripple-throw',
    gumroad_url: 'https://gumroad.com/l/sunset-ripple-throw-pattern',
    is_hot: false,
    is_published: true,
    created_at: '2025-01-20T12:00:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
  {
    id: 'pat-007',
    title: 'Pastel Sleepy Boba Bear Plushie',
    slug: 'pastel-sleepy-boba-bear-plushie',
    image_url: '/images/sleepy-boba-bear.jpg',
    pdf_size: '3.1 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/sleepy-boba-bear',
    gumroad_url: 'https://gumroad.com/l/sleepy-boba-bear-pattern',
    is_hot: true,
    is_published: true,
    created_at: '2025-01-22T08:30:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
  {
    id: 'pat-008',
    title: 'Boho Linen Hair Bandana Kerchief',
    slug: 'boho-linen-hair-bandana-kerchief',
    image_url: '/images/boho-linen-bandana.jpg',
    pdf_size: '2.4 MB',
    difficulty_tag: 'Beginner Friendly',
    cpa_locker_url: 'https://cpatracking.co/locker/boho-bandana-kerchief',
    gumroad_url: 'https://gumroad.com/l/boho-bandana-kerchief-pattern',
    is_hot: false,
    is_published: true,
    created_at: '2025-01-24T15:20:00Z',
    description: 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
  },
];

```

# lib\storage.ts

```ts
import fs from 'fs';
import path from 'path';
import { Pattern, PatternFormData } from './types';
import { INITIAL_PATTERNS } from './initial-data';
import { getSupabaseClient } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'patterns.json');

let memoryPatterns: Pattern[] = [...INITIAL_PATTERNS];

function ensureFileStore(): Pattern[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_PATTERNS, null, 2), 'utf-8');
      return INITIAL_PATTERNS;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const normalized = parsed.map((p) => ({
        ...p,
        pdf_size: p.pdf_size || '3.5 MB',
        difficulty_tag: p.difficulty_tag || 'Beginner Friendly',
        gumroad_url: p.gumroad_url || '',
        is_hot: Boolean(p.is_hot),
        is_best_seller: Boolean(p.is_best_seller),
        rating: typeof p.rating === 'number' ? p.rating : 5,
        reviews_count: typeof p.reviews_count === 'number' ? p.reviews_count : 128,
      }));
      memoryPatterns = normalized;
      return normalized;
    }
    return INITIAL_PATTERNS;
  } catch (err) {
    console.warn('File store error, falling back to memory:', err);
    return memoryPatterns;
  }
}

function saveFileStore(patterns: Pattern[]) {
  memoryPatterns = patterns;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(patterns, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist patterns to file:', err);
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getAllPatterns(onlyPublished = false): Promise<Pattern[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      let query = sb.from('patterns').select('*').order('created_at', { ascending: false });
      if (onlyPublished) {
        query = query.eq('is_published', true);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Pattern[];
      }
    } catch (err) {
      console.warn('Supabase fetch failed, checking local:', err);
    }
  }

  const local = ensureFileStore();
  const list = onlyPublished ? local.filter((p) => p.is_published) : local;
  return [...list].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getPatternBySlug(slug: string): Promise<Pattern | null> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('patterns')
        .select('*')
        .eq('slug', slug)
        .single();
      if (!error && data) {
        return data as Pattern;
      }
    } catch (err) {
      console.warn('Supabase fetch by slug failed, checking local:', err);
    }
  }

  const local = ensureFileStore();
  return local.find((p) => p.slug === slug) || null;
}

export async function createPattern(input: PatternFormData): Promise<Pattern> {
  const baseSlug = input.slug && input.slug.trim().length > 0
    ? generateSlug(input.slug)
    : generateSlug(input.title);

  const currentList = ensureFileStore();
  let finalSlug = baseSlug;
  let counter = 1;
  while (currentList.some((p) => p.slug === finalSlug)) {
    finalSlug = `${baseSlug}-${counter++}`;
  }

  const newPattern: Pattern = {
    id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: input.title.trim(),
    slug: finalSlug,
    image_url: input.image_url.trim() || '/images/hero-crochet.jpg',
    pdf_size: input.pdf_size ? input.pdf_size.trim() : '3.5 MB',
    difficulty_tag: input.difficulty_tag ? input.difficulty_tag.trim() : 'Beginner Friendly',
    cpa_locker_url: input.cpa_locker_url.trim(),
    gumroad_url: input.gumroad_url?.trim() || '',
    is_hot: Boolean(input.is_hot),
    is_best_seller: Boolean(input.is_best_seller),
    description: input.description?.trim() || 'Download the full printable PDF pattern with stitch count and step-by-step instructions.',
    is_published: input.is_published ?? true,
    rating: input.rating !== undefined ? Number(input.rating) : 5,
    reviews_count: input.reviews_count !== undefined ? Number(input.reviews_count) : 128,
    created_at: new Date().toISOString(),
  };

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb.from('patterns').insert(newPattern).select().single();
      if (!error && data) {
        saveFileStore([data as Pattern, ...currentList]);
        return data as Pattern;
      }
    } catch (err) {
      console.warn('Supabase insert failed, saving locally:', err);
    }
  }

  saveFileStore([newPattern, ...currentList]);
  return newPattern;
}

export async function updatePattern(id: string, updates: Partial<PatternFormData>): Promise<Pattern | null> {
  const currentList = ensureFileStore();
  const existingIndex = currentList.findIndex((p) => p.id === id);
  if (existingIndex === -1) {
    return null;
  }

  const existing = currentList[existingIndex];
  const updatedPattern: Pattern = {
    ...existing,
    ...updates,
    slug: updates.slug ? generateSlug(updates.slug) : (updates.title ? generateSlug(updates.title) : existing.slug),
    id: existing.id,
    created_at: existing.created_at,
    gumroad_url: updates.gumroad_url !== undefined ? updates.gumroad_url.trim() : existing.gumroad_url,
    is_hot: updates.is_hot !== undefined ? Boolean(updates.is_hot) : existing.is_hot,
    is_best_seller: updates.is_best_seller !== undefined ? Boolean(updates.is_best_seller) : existing.is_best_seller,
    rating: updates.rating !== undefined ? Number(updates.rating) : (existing.rating ?? 5),
    reviews_count: updates.reviews_count !== undefined ? Number(updates.reviews_count) : (existing.reviews_count ?? 128),
  };

  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('patterns')
        .update(updatedPattern)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        currentList[existingIndex] = data as Pattern;
        saveFileStore(currentList);
        return data as Pattern;
      }
    } catch (err) {
      console.warn('Supabase update failed:', err);
    }
  }

  currentList[existingIndex] = updatedPattern;
  saveFileStore(currentList);
  return updatedPattern;
}

export async function deletePattern(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      await sb.from('patterns').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }

  const currentList = ensureFileStore();
  const filtered = currentList.filter((p) => p.id !== id);
  saveFileStore(filtered);
  return true;
}

export async function saveAllPatterns(patterns: Pattern[]): Promise<Pattern[]> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      // Upsert all patterns to Supabase
      const { data, error } = await sb.from('patterns').upsert(patterns, { onConflict: 'id' }).select();
      if (!error && data) {
        saveFileStore(patterns);
        return patterns;
      }
    } catch (err) {
      console.warn('Supabase saveAllPatterns failed, saving locally:', err);
    }
  }

  saveFileStore(patterns);
  return patterns;
}

export async function resetToDefaults(): Promise<Pattern[]> {
  saveFileStore([...INITIAL_PATTERNS]);
  return [...INITIAL_PATTERNS];
}

```

# lib\supabase.ts

```ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your_supabase_url') &&
    !supabaseAnonKey.includes('your_supabase_anon_key')
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!client && supabaseUrl && supabaseAnonKey) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

/**
 * Upload an image file to Supabase Storage bucket `pattern-images`
 */
export async function uploadImageToSupabase(file: File): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `patterns/${fileName}`;

    const { error: uploadError } = await sb.storage
      .from('pattern-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload error:', uploadError.message);
      return null;
    }

    const { data } = sb.storage.from('pattern-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to Supabase:', err);
    return null;
  }
}

```

# lib\types.ts

```ts
export interface Pattern {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  pdf_size: string; // e.g. "3.8 MB"
  difficulty_tag: string; // Default: "Beginner Friendly"
  cpa_locker_url: string; // Unique CPA link
  gumroad_url?: string; // Optional direct Gumroad purchase link
  is_hot?: boolean; // Toggles "HOT" badge on card
  is_best_seller?: boolean; // Toggles "BEST SELLER" badge on card
  is_published: boolean;
  created_at: string;
  description?: string;
  size?: string;
  rating?: number;
  reviews_count?: number;
}

export interface PatternFormData {
  title: string;
  slug?: string;
  image_url: string;
  pdf_size: string;
  difficulty_tag?: string;
  cpa_locker_url: string;
  gumroad_url?: string;
  is_hot?: boolean;
  is_best_seller?: boolean;
  is_published?: boolean;
  description?: string;
  rating?: number;
  reviews_count?: number;
}

```

# lib\utils.ts

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```

# metadata.json

```json
{
  "name": "Trendy Crochet Patterns",
  "description": "CPA-monetized free crochet pattern directory with retro neo-brutal aesthetics, Pinterest-optimized sharing, and instant PDF guide lockers.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}

```

# next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference path="./.next/types/routes.d.ts" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.

```

# next.config.ts

```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;

```

# package.json

```json
{
  "name": "ai-studio-applet",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "clean": "next clean"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@hookform/resolvers": "^5.2.1",
    "@supabase/supabase-js": "^2.117.3",
    "autoprefixer": "^10.4.21",
    "canvas-confetti": "^1.9.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.553.0",
    "motion": "^12.23.24",
    "next": "^15.4.9",
    "postcss": "^8.5.6",
    "react": "^19.2.1",
    "react-dom": "^19.2.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.1.11",
    "@tailwindcss/typography": "^0.5.19",
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "9.39.1",
    "eslint-config-next": "16.0.8",
    "firebase-tools": "^15.0.0",
    "tailwindcss": "4.1.11",
    "tw-animate-css": "^1.4.0",
    "typescript": "5.9.3"
  }
}

```

# postcss.config.mjs

```mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

export default config;

```

# public\assets\aistudio\image_8028c768.png

This is a binary file of the type: Image

# public\assets\aistudio\image_d5860d9b.png

This is a binary file of the type: Image

# public\assets\aistudio\Screenshot_2026-10-20_152004_67cc519c.png

This is a binary file of the type: Image

# public\images\boho-linen-bandana.jpg

This is a binary file of the type: Image

# public\images\checkered-mug-rugs.jpg

This is a binary file of the type: Image

# public\images\coquette-halter-top.jpg

This is a binary file of the type: Image

# public\images\daisy-granny-bag.jpg

This is a binary file of the type: Image

# public\images\hero_crochet_retro_1791554627877.jpg

This is a binary file of the type: Image

# public\images\hero-crochet.jpg

This is a binary file of the type: Image

# public\images\mushroom-bucket-hat.jpg

This is a binary file of the type: Image

# public\images\pattern_daisy_granny_bag_1791554655166.jpg

This is a binary file of the type: Image

# public\images\pattern_mushroom_bucket_hat_1791554669696.jpg

This is a binary file of the type: Image

# public\images\pattern_strawberry_cardigan_1791554640085.jpg

This is a binary file of the type: Image

# public\images\sleepy-boba-bear.jpg

This is a binary file of the type: Image

# public\images\strawberry-cardigan.jpg

This is a binary file of the type: Image

# public\images\sunset-ripple-throw.jpg

This is a binary file of the type: Image

# public\logo.png

This is a binary file of the type: Image

# README.md

```md
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/8d26e761-bbcf-464e-9250-a05aa4001534

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

```

# src\assets\images\boho_linen_bandana_1791597247541.jpg

This is a binary file of the type: Image

# src\assets\images\checkered_mug_rugs_1791597187634.jpg

This is a binary file of the type: Image

# src\assets\images\coquette_halter_top_1791597164759.jpg

This is a binary file of the type: Image

# src\assets\images\crochet_retro_logo_1791554758618.jpg

This is a binary file of the type: Image

# src\assets\images\hero_crochet_retro_1791554627877.jpg

This is a binary file of the type: Image

# src\assets\images\pattern_daisy_granny_bag_1791554655166.jpg

This is a binary file of the type: Image

# src\assets\images\pattern_mushroom_bucket_hat_1791554669696.jpg

This is a binary file of the type: Image

# src\assets\images\pattern_strawberry_cardigan_1791554640085.jpg

This is a binary file of the type: Image

# src\assets\images\sleepy_boba_bear_1791597222442.jpg

This is a binary file of the type: Image

# src\assets\images\sunset_ripple_throw_1791597203699.jpg

This is a binary file of the type: Image

# tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}

```

