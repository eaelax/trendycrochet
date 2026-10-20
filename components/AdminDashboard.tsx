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
  Pin,
  Upload,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Eye,
  ShoppingBag,
  Save,
  Search,
  Star,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Pattern } from '@/lib/types';
import { uploadImageToSupabase, isSupabaseConfigured } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [adminToken, setAdminToken] = useState<string>('');

  // Patterns state
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

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
      // 1. Check localStorage first
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

      // 2. Fetch from backend storage
      const res = await fetch('/api/admin/patterns', {
        headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.patterns && Array.isArray(data.patterns)) {
        setPatterns(data.patterns);
        localStorage.setItem('trendy_crochet_patterns', JSON.stringify(data.patterns));
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

  // SAVE CHANGES: Persists current dashboard patterns to localStorage AND server API simultaneously
  const handleDashboardSave = async () => {
    setIsSaving(true);
    try {
      // 1. Persist directly to localStorage
      localStorage.setItem('trendy_crochet_patterns', JSON.stringify(patterns));

      // 2. Broadcast event across client tabs/components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('crochet_patterns_updated'));
      }

      // 3. Persist to server API storage file
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
      setTimeout(() => setSaveSuccess(false), 3500);
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
    setFormImageUrl('https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80');
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
    setFormImageUrl(p.image_url);
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

    const baseSlug = formSlug.trim() || formTitle.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');

    if (editingPattern) {
      const updated = patterns.map((p) =>
        p.id === editingPattern.id
          ? {
              ...p,
              title: formTitle.trim(),
              slug: baseSlug,
              image_url: formImageUrl.trim() || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
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
        image_url: formImageUrl.trim() || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
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

  // Delete Pattern
  const handleDeletePattern = () => {
    if (!deletingPattern) return;
    const filtered = patterns.filter((p) => p.id !== deletingPattern.id);
    setPatterns(filtered);
    setDeletingPattern(null);
  };

  // Reset to default sample patterns
  const handleResetSamplePatterns = async () => {
    if (!confirm('Reset all patterns to default sample patterns?')) return;
    const effectiveToken = adminToken || sessionStorage.getItem('trendy_admin_token') || 'BlackCanonerEoser#15';
    try {
      const res = await fetch('/api/admin/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (res.ok && data.patterns) {
        setPatterns(data.patterns);
        localStorage.setItem('trendy_crochet_patterns', JSON.stringify(data.patterns));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('crochet_patterns_updated'));
        }
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
      } catch {}
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

  // Authenticated Dashboard (No Horizontal Scroll - Fully Responsive Grid & Card Layout)
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full overflow-x-hidden">
      {saveSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>All changes were successfully saved and applied to the website!</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-[#2D1C17] mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to website</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2D1C17]">
            Pattern Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage, edit, or remove patterns. Click <strong className="text-[#E65F43]">Save Changes</strong> to apply updates to the live site.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDashboardSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E5A914] hover:bg-[#d0950a] text-stone-950 text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-colors shadow-xs disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
            <span>Save Changes</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Pattern</span>
          </button>

          <button
            onClick={handleResetSamplePatterns}
            title="Reset to default sample patterns"
            className="p-2.5 text-stone-500 hover:text-[#2D1C17] bg-white border border-stone-200 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2.5 text-stone-500 hover:text-red-600 bg-white border border-stone-200 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search and Summary Bar */}
      <div className="bg-white border border-stone-200 rounded-xl p-3 sm:p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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
        <div className="text-xs text-stone-500 font-medium">
          Showing <span className="font-bold text-stone-900">{filteredPatterns.length}</span> of {patterns.length} patterns
        </div>
      </div>

      {/* Pattern Cards List - No Horizontal Scrolling */}
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
          {filteredPatterns.map((pattern) => (
            <div
              key={pattern.id}
              className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-colors"
            >
              <div>
                {/* Top Row: Thumbnail + Title + Status */}
                <div className="flex gap-3.5 items-start mb-3">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                    <Image
                      src={pattern.image_url || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'}
                      alt={pattern.title}
                      fill
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

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyPinterestLink(pattern)}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedId === pattern.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied Pin</span>
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
                    className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Preview on website"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(pattern)}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingPattern(pattern)}
                    className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Delete pattern"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORM MODAL: Add / Edit Pattern */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-stone-200 max-w-lg w-full p-6 my-8 relative shadow-xl">
            <h2 className="text-lg font-bold text-[#2D1C17] mb-1">
              {editingPattern ? 'Edit Pattern Details' : 'Add New Pattern'}
            </h2>
            <p className="text-xs text-stone-500 mb-5">
              Edit pattern details below. Click &quot;Save Changes&quot; on the dashboard to apply to all pages simultaneously.
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
              Are you sure you want to remove &ldquo;{deletingPattern.title}&rdquo;? Click &quot;Save Changes&quot; afterward to apply the removal to the live website.
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
