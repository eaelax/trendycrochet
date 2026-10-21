'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Check,
  Upload,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Save,
  Search,
  Star,
  FileText,
  Sparkles,
  Copy,
  GitBranch,
  Download,
  ImageIcon,
  ShoppingBag,
  GripVertical,
  ChevronUp,
  ChevronDown,
  HelpCircle,
} from 'lucide-react';
import { Pattern } from '@/lib/types';
import { uploadImageToSupabase, isSupabaseConfigured } from '@/lib/supabase';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80';

// Automatically handles "public/image.jpg", "/public/image.jpg", "image.jpg", and external URLs
export function normalizeImageUrl(url?: string): string {
  if (!url) return '';
  let clean = url.trim();
  clean = clean.replace(/\[img\]/gi, '').replace(/\[\/img\]/gi, '').trim();
  if (!clean) return '';
  if (/^(https?:\/\/|data:)/i.test(clean)) {
    return clean;
  }
  // Convert "public/photo.jpg" or "/public/photo.jpg" to "/photo.jpg"
  clean = clean.replace(/^\/?public\//i, '/');
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  return clean;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [adminToken, setAdminToken] = useState<string>('');

  // Patterns state
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  // Drag and drop slide reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
  const [formDescription, setFormDescription] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formRating, setFormRating] = useState(5.0);
  const [formReviewsCount, setFormReviewsCount] = useState(128);

  // File Upload
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPatterns = useCallback(async (token?: string) => {
    setIsLoadingPatterns(true);
    const effectiveToken =
      token ||
      adminToken ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('trendy_admin_token') : '') ||
      '';

    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('trendy_crochet_patterns');
        if (saved !== null) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPatterns(parsed);
            setIsLoadingPatterns(false);
            return;
          }
        }
      }

      const res = await fetch('/api/admin/patterns', {
        headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.patterns && Array.isArray(data.patterns)) {
        setPatterns(data.patterns);
        try {
          localStorage.setItem('trendy_crochet_patterns', JSON.stringify(data.patterns));
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load patterns from server:', err);
    } finally {
      setIsLoadingPatterns(false);
    }
  }, [adminToken]);

  // Check auth status on initial load
  useEffect(() => {
    let active = true;
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('trendy_admin_token') : null;

    fetch('/api/admin/auth', {
      headers: stored ? { Authorization: `Bearer ${stored}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.authenticated || stored === 'BlackCanonerEoser#15') {
          setIsAuthenticated(true);
          if (stored) setAdminToken(stored);
          fetchPatterns(stored || undefined);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        if (active) {
          if (stored === 'BlackCanonerEoser#15') {
            setIsAuthenticated(true);
            setAdminToken(stored);
            fetchPatterns(stored);
          } else {
            setIsAuthenticated(false);
          }
        }
      });

    return () => {
      active = false;
    };
  }, [fetchPatterns]);

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
        const tokenVal = data.token || secretKeyInput;
        setIsAuthenticated(true);
        setAdminToken(tokenVal);
        sessionStorage.setItem('trendy_admin_token', tokenVal);
        fetchPatterns(tokenVal);
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
    } catch {}
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('trendy_admin_token');
    }
    setIsAuthenticated(false);
    setAdminToken('');
    setPatterns([]);
  };

  // Reorder / Slide sorting
  const movePattern = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= patterns.length) return;
    const updated = [...patterns];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPatterns(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('trendy_crochet_patterns', JSON.stringify(updated));
      window.dispatchEvent(new Event('crochet_patterns_updated'));
    }
  };

  const handleMoveUp = (patternId: string) => {
    const idx = patterns.findIndex((p) => p.id === patternId);
    if (idx > 0) {
      movePattern(idx, idx - 1);
    }
  };

  const handleMoveDown = (patternId: string) => {
    const idx = patterns.findIndex((p) => p.id === patternId);
    if (idx !== -1 && idx < patterns.length - 1) {
      movePattern(idx, idx + 1);
    }
  };

  const handleMoveToTop = (patternId: string) => {
    const idx = patterns.findIndex((p) => p.id === patternId);
    if (idx > 0) {
      movePattern(idx, 0);
    }
  };

  // Save changes
  const handleDashboardSave = async () => {
    setIsSaving(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('trendy_crochet_patterns', JSON.stringify(patterns));
        window.dispatchEvent(new Event('crochet_patterns_updated'));
      }

      const effectiveToken = adminToken || sessionStorage.getItem('trendy_admin_token') || 'BlackCanonerEoser#15';
      await fetch('/api/admin/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ action: 'sync', patterns }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
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
    setFormImageUrl('');
    setFormPdfSize('3.8 MB');
    setFormDifficultyTag('Beginner Friendly');
    setFormCpaLockerUrl('https://cpatracking.co/locker/pattern-download');
    setFormGumroadUrl('');
    setFormDescription('Download the full printable PDF pattern with stitch count, tutorial photos, and step-by-step instructions.');
    setFormIsPublished(true);
    setFormIsBestSeller(false);
    setFormRating(5.0);
    setFormReviewsCount(128);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Pattern) => {
    setEditingPattern(p);
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormImageUrl(p.image_url || '');
    setFormPdfSize(p.pdf_size || '3.5 MB');
    setFormDifficultyTag(p.difficulty_tag || 'Beginner Friendly');
    setFormCpaLockerUrl(p.cpa_locker_url || '');
    setFormGumroadUrl(p.gumroad_url || '');
    setFormDescription(p.description || 'Download the full printable PDF pattern with stitch count, tutorial photos, and step-by-step instructions.');
    setFormIsPublished(p.is_published);
    setFormIsBestSeller(Boolean(p.is_best_seller));
    setFormRating(p.rating ?? 5.0);
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

  const handleToggleBestSeller = (id: string) => {
    const updated = patterns.map((p) =>
      p.id === id ? { ...p, is_best_seller: !p.is_best_seller } : p
    );
    setPatterns(updated);
  };

  // Add / Edit Pattern Form Submission
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

    const cleanImg = normalizeImageUrl(formImageUrl) || FALLBACK_IMAGE;
    const baseSlug =
      formSlug.trim() ||
      formTitle
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-');

    if (editingPattern) {
      const updated = patterns.map((p) =>
        p.id === editingPattern.id
          ? {
              ...p,
              title: formTitle.trim(),
              slug: baseSlug,
              image_url: cleanImg,
              pdf_size: formPdfSize.trim() || '3.5 MB',
              difficulty_tag: formDifficultyTag.trim() || 'Beginner Friendly',
              cpa_locker_url: formCpaLockerUrl.trim(),
              gumroad_url: formGumroadUrl.trim(),
              description: formDescription.trim(),
              is_published: formIsPublished,
              is_best_seller: formIsBestSeller,
              rating: Number(formRating) || 5.0,
              reviews_count: Number(formReviewsCount) || 128,
            }
          : p
      );
      setPatterns(updated);
    } else {
      const newPattern: Pattern = {
        id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: formTitle.trim(),
        slug: baseSlug,
        image_url: cleanImg,
        pdf_size: formPdfSize.trim() || '3.5 MB',
        difficulty_tag: formDifficultyTag.trim() || 'Beginner Friendly',
        cpa_locker_url: formCpaLockerUrl.trim(),
        gumroad_url: formGumroadUrl.trim(),
        description: formDescription.trim(),
        is_published: formIsPublished,
        is_best_seller: formIsBestSeller,
        rating: Number(formRating) || 5.0,
        reviews_count: Number(formReviewsCount) || 128,
        created_at: new Date().toISOString(),
      };
      setPatterns([newPattern, ...patterns]);
    }

    setIsModalOpen(false);
  };

  const handleDeletePattern = () => {
    if (!deletingPattern) return;
    const filtered = patterns.filter((p) => p.id !== deletingPattern.id);
    setPatterns(filtered);
    setDeletingPattern(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('trendy_crochet_patterns', JSON.stringify(filtered));
      window.dispatchEvent(new Event('crochet_patterns_updated'));
    }
  };

  const filteredPatterns = useMemo(() => {
    if (!filterQuery.trim()) return patterns;
    const q = filterQuery.toLowerCase();
    return patterns.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.difficulty_tag?.toLowerCase().includes(q)
    );
  }, [patterns, filterQuery]);

  const generateInitialDataCode = () => {
    return `import { Pattern } from './types';\n\nexport const INITIAL_PATTERNS: Pattern[] = ${JSON.stringify(
      patterns,
      null,
      2
    )};\n`;
  };

  const handleCopyInitialDataCode = async () => {
    try {
      await navigator.clipboard.writeText(generateInitialDataCode());
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 3000);
    } catch {}
  };

  const handleDownloadInitialDataFile = () => {
    const code = generateInitialDataCode();
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'initial-data.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  // Password Login Gate
  if (!isAuthenticated) {
    return (
      <div className="py-20 px-4 max-w-sm mx-auto">
        <div className="bg-white rounded-xl border border-stone-200 p-8 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-[#E65F43]/10 text-[#E65F43] flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>

          <h1 className="text-xl font-bold text-[#2D1C17] text-center mb-1">
            Admin Authentication
          </h1>
          <p className="text-xs text-stone-500 text-center mb-6">
            Enter your admin password to access the pattern manager.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                placeholder="Enter password..."
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

  // Authenticated Dashboard
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full overflow-x-hidden">
      {saveSuccess && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>All changes and custom pattern order were saved!</span>
        </div>
      )}

      {/* Redesigned Simple Top Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
        {/* Navigation & User actions */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to website</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
              <span>How to deploy to GitHub</span>
            </button>
            <span className="text-stone-200">|</span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-red-600 font-medium cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Header Title + Simple Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D1C17] flex items-center gap-2.5">
              <span>Crochet Patterns Manager</span>
              <span className="text-xs bg-stone-100 text-stone-700 font-semibold px-2.5 py-0.5 rounded-full border border-stone-200">
                {patterns.length} Total
              </span>
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              Drag by the <strong className="text-stone-800">⠿ grip handle</strong> to slide order, edit details, or add new patterns.
            </p>
          </div>

          {/* Simple, Easy Primary Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#E65F43] hover:bg-[#d04e33] text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Pattern</span>
            </button>

            <button
              onClick={handleDashboardSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-colors shadow-xs disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
              <span>Save Changes</span>
            </button>

            <button
              onClick={handleDownloadInitialDataFile}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
              title="Download initial-data.ts to commit to GitHub"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Download File for GitHub</span>
            </button>
          </div>
        </div>

        {/* Clean Search Bar */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search patterns by title or tag..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-[#E65F43]"
            />
          </div>

          <div className="text-xs text-stone-500 font-medium w-full sm:w-auto text-left sm:text-right">
            Showing <strong className="text-stone-900">{filteredPatterns.length}</strong> of {patterns.length} patterns
            {filterQuery && (
              <span className="text-amber-700 text-[11px] ml-2">
                (Clear search to drag &amp; slide order)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pattern Cards List - Drag & Drop / Slide Reordering */}
      {isLoadingPatterns ? (
        <div className="p-16 text-center text-xs text-stone-500 flex items-center justify-center gap-2 bg-white rounded-xl border border-stone-200">
          <RefreshCw className="w-4 h-4 animate-spin text-[#E65F43]" />
          <span>Loading patterns...</span>
        </div>
      ) : filteredPatterns.length === 0 ? (
        <div className="p-16 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200">
          No patterns found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatterns.map((pattern) => {
            const patternCleanImg = normalizeImageUrl(pattern.image_url) || FALLBACK_IMAGE;
            const actualIndex = patterns.findIndex((p) => p.id === pattern.id);
            const isFirst = actualIndex === 0;
            const isLast = actualIndex === patterns.length - 1;

            return (
              <div
                key={pattern.id}
                draggable={!filterQuery}
                onDragStart={() => setDraggedIndex(actualIndex)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(actualIndex);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onDrop={() => {
                  if (draggedIndex !== null && draggedIndex !== actualIndex) {
                    movePattern(draggedIndex, actualIndex);
                  }
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all select-none ${
                  dragOverIndex === actualIndex
                    ? 'border-[#E65F43] ring-2 ring-[#E65F43]/30 scale-[1.01]'
                    : 'border-stone-200 hover:border-stone-300'
                } ${draggedIndex === actualIndex ? 'opacity-40' : ''}`}
              >
                <div>
                  {/* Top Slide / Reorder Bar */}
                  <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-stone-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                        title="Click and drag to slide into new position"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <span className="font-bold text-stone-800 bg-stone-100 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="text-[#E65F43]">#{actualIndex + 1}</span>
                        <span className="text-stone-400 font-normal">
                          {actualIndex === 0 ? '(1st)' : actualIndex === 1 ? '(2nd)' : actualIndex === 2 ? '(3rd)' : ''}
                        </span>
                      </span>
                    </div>

                    {/* Quick Slide Up / Down buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(pattern.id)}
                        disabled={isFirst}
                        className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                        title="Slide Up (Move earlier)"
                      >
                        <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(pattern.id)}
                        disabled={isLast}
                        className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                        title="Slide Down (Move later)"
                      >
                        <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      {!isFirst && (
                        <button
                          type="button"
                          onClick={() => handleMoveToTop(pattern.id)}
                          className="text-[10px] font-bold text-stone-500 hover:text-[#E65F43] px-1.5 py-0.5 rounded hover:bg-stone-100 cursor-pointer ml-0.5"
                          title="Move directly to #1 (First)"
                        >
                          Top
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail + Title + Status */}
                  <div className="flex gap-3.5 items-start mb-3">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      <Image
                        src={patternCleanImg}
                        alt={pattern.title}
                        fill
                        unoptimized
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/${pattern.slug}`}
                          target="_blank"
                          className="font-bold text-sm text-[#2D1C17] hover:text-[#E65F43] truncate block"
                        >
                          {pattern.title}
                        </Link>
                      </div>

                      <div className="text-[11px] text-stone-400 font-mono truncate mb-1">
                        /{pattern.slug}
                      </div>

                      {/* Tags row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[#BF8CE3]/20 text-[#7D3EAB] font-bold text-[10px] px-2 py-0.5 rounded-full">
                          {pattern.difficulty_tag || 'Beginner Friendly'}
                        </span>
                        <span className="bg-stone-100 text-stone-700 font-mono text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <FileText className="w-3 h-3 text-stone-500" />
                          <span>{pattern.pdf_size || '3.5 MB'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleBestSeller(pattern.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors flex items-center gap-1 ${
                            pattern.is_best_seller
                              ? 'bg-[#E65F43] text-white'
                              : 'bg-stone-100 text-stone-400 hover:text-stone-700'
                          }`}
                          title="Click to toggle Best Seller status"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{pattern.is_best_seller ? 'Best Seller' : 'Not Best Seller'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rating & Reviews + CPA URL */}
                  <div className="bg-stone-50 rounded-lg p-2.5 text-xs space-y-1 mb-3">
                    <div className="flex items-center justify-between text-stone-600">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-semibold text-stone-900">{pattern.rating ?? 5.0}</span>
                        <span className="text-stone-400">({pattern.reviews_count ?? 128} reviews)</span>
                      </div>
                      {pattern.gumroad_url && (
                        <span className="text-emerald-700 font-medium text-[11px] flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>$2.00 Option</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
                      <span className="font-semibold text-stone-600">CPA:</span>
                      <span className="truncate flex-1">{pattern.cpa_locker_url}</span>
                      <a
                        href={pattern.cpa_locker_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E65F43] hover:underline shrink-0"
                        title="Open CPA Locker"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-stone-400">
                    {pattern.is_published ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Published
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                        Draft
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(pattern)}
                      className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeletingPattern(pattern)}
                      className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GitHub Sync Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-2xl w-full p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#2D1C17]">
                  Deploy to GitHub &amp; Vercel (All Devices)
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 mb-4 text-xs text-stone-600">
              <p>
                To make your additions, custom pattern order, edits, and deletions live for <strong>every device and visitor</strong> on Vercel:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 bg-stone-50 p-3 rounded-lg border border-stone-200 font-medium text-stone-800">
                <li>
                  Click the green <strong>Download initial-data.ts</strong> button below.
                </li>
                <li>
                  Replace the file at <code className="bg-white px-1.5 py-0.5 rounded border border-stone-300 font-mono text-[#E65F43]">lib/initial-data.ts</code> in your desktop project folder.
                </li>
                <li>
                  Commit &amp; push to GitHub:
                  <div className="mt-1 bg-stone-900 text-stone-100 p-2 rounded font-mono text-[11px]">
                    git add lib/initial-data.ts<br />
                    git commit -m &quot;Update crochet patterns order&quot;<br />
                    git push
                  </div>
                </li>
              </ol>
              <p className="text-[11px] text-stone-500">
                Vercel will detect your push and automatically update the website across the globe in 30 seconds!
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={handleDownloadInitialDataFile}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Download initial-data.ts</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyInitialDataCode}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {exportCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{exportCopied ? 'Code Copied!' : 'Copy File Content'}</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-3.5 py-2 text-stone-600 hover:text-stone-900 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Pattern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-stone-200 max-w-xl w-full p-6 shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="text-base font-bold text-[#2D1C17]">
                {editingPattern ? 'Edit Crochet Pattern' : 'Add New Crochet Pattern'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 mb-4">
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
                  placeholder="e.g. Amigurumi Stitch Toy Crochet Pattern"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                  required
                />
                <span className="text-[10px] text-stone-400 font-mono mt-1 block">
                  Slug: /{formSlug || 'auto-generated'}
                </span>
              </div>

              {/* 2. Image URL with Auto-handling and Live Preview */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Image URL / Public filename *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="e.g. /stitch.jpeg or public/stitch.jpeg or https://i.postimg.cc/..."
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
                <div className="text-[10px] text-stone-500 mt-1">
                  💡 <strong>Tip for GitHub images:</strong> Both <code className="text-stone-800">public/image.jpeg</code> and <code className="text-stone-800">/image.jpeg</code> work automatically.
                </div>

                {/* Live Image Preview */}
                {formImageUrl.trim() && (
                  <div className="mt-2.5 p-2 bg-stone-50 rounded-lg border border-stone-200 flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-md overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                      <Image
                        src={normalizeImageUrl(formImageUrl)}
                        alt="Image Preview"
                        fill
                        unoptimized
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-[11px] text-stone-600 min-w-0">
                      <span className="font-semibold text-stone-800 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-stone-500" /> Image Preview
                      </span>
                      <span className="truncate block text-stone-400 text-[10px] font-mono">
                        Resolved path: {normalizeImageUrl(formImageUrl)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. PDF File Size & Difficulty */}
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

              {/* 4. Rating & Reviews Count */}
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
                    onChange={(e) => setFormRating(parseFloat(e.target.value) || 5.0)}
                    placeholder="5.0"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                    required
                  />
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

              {/* 6. Gumroad URL */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Gumroad Purchase URL (Optional)
                </label>
                <input
                  type="url"
                  value={formGumroadUrl}
                  onChange={(e) => setFormGumroadUrl(e.target.value)}
                  placeholder="https://gumroad.com/l/your-pattern-slug"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                />
              </div>

              {/* 7. Description */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Description / Stitch Details
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Download the full printable PDF pattern with stitch counts and photo tutorial."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-[#2D1C17] focus:outline-none focus:border-[#E65F43]"
                />
              </div>

              {/* 8. Best Seller Toggle */}
              <div className="flex items-center gap-2.5 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="modal-is-best-seller"
                  checked={formIsBestSeller}
                  onChange={(e) => setFormIsBestSeller(e.target.checked)}
                  className="w-4 h-4 text-[#E65F43] rounded border-stone-300 focus:ring-[#E65F43] cursor-pointer"
                />
                <label htmlFor="modal-is-best-seller" className="font-bold text-stone-900 text-xs cursor-pointer select-none">
                  Mark as Best Seller (Included in Best Sellers page &amp; badge)
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
          <div className="bg-white rounded-xl border border-stone-200 max-w-sm w-full p-6 text-center shadow-lg">
            <h3 className="text-base font-bold text-[#2D1C17] mb-2">
              Delete Pattern?
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Are you sure you want to remove &ldquo;{deletingPattern.title}&rdquo;? Click &quot;Save Changes&quot; and &quot;Download File for GitHub&quot; afterward to permanently update GitHub + Vercel for all devices.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeletingPattern(null)}
                className="px-3.5 py-2 text-stone-600 font-semibold text-xs rounded-lg border border-stone-200 cursor-pointer hover:bg-stone-50"
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
