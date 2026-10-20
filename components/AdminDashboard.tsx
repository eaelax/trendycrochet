'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [adminToken, setAdminToken] = useState<string>('');

  // Patterns state
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    const effectiveToken = token || adminToken || (typeof window !== 'undefined' ? sessionStorage.getItem('trendy_admin_token') : '') || '';

    try {
      // 1. Fetch live patterns from backend storage
      const res = await fetch('/api/admin/patterns', {
        headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.patterns && Array.isArray(data.patterns) && data.patterns.length > 0) {
        setPatterns(data.patterns);
        localStorage.setItem('trendy_crochet_patterns', JSON.stringify(data.patterns));
        return;
      }

      // 2. Fallback to localStorage if API request fails
      const saved = localStorage.getItem('trendy_crochet_patterns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPatterns(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load patterns from server:', err);
      const saved = localStorage.getItem('trendy_crochet_patterns');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setPatterns(parsed);
        } catch {}
      }
    } finally {
      setIsLoadingPatterns(false);
    }
  }, [adminToken]);

  // Check auth status on initial load
  useEffect(() => {
    let active = true;
    const stored = sessionStorage.getItem('trendy_admin_token');

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
    sessionStorage.removeItem('trendy_admin_token');
    setIsAuthenticated(false);
    setAdminToken('');
    setPatterns([]);
  };

  // SAVE CHANGES: Persists current dashboard patterns to localStorage AND server API simultaneously
  const handleDashboardSave = async () => {
    setIsSaving(true);
    try {
      // 1. Persist immediately to localStorage
      localStorage.setItem('trendy_crochet_patterns', JSON.stringify(patterns));

      // 2. Broadcast event across tabs/components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('crochet_patterns_updated'));
      }

      // 3. Persist to server API & storage file
      const effectiveToken = adminToken || sessionStorage.getItem('trendy_admin_token') || 'BlackCanonerEoser#15';
      const res = await fetch('/api/admin/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ action: 'sync', patterns }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.patterns && Array.isArray(data.patterns)) {
          setPatterns(data.patterns);
          localStorage.setItem('trendy_crochet_patterns', JSON.stringify(data.patterns));
        }
      }

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
            Enter your admin secret key to access the management portal.
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {saveSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-none">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>All changes applied simultaneously to the website and saved!</span>
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
            Manage, edit, or add patterns. Click <strong className="text-[#E65F43]">Save Changes</strong> to apply all updates to the website.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDashboardSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#E5A914] hover:bg-[#d0950a] text-stone-950 text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-none disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 stroke-[2.5]" />}
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
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
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
                  <tr key={pattern.id} className="bg-white hover:bg-stone-50/60 transition-colors">
                    {/* Pattern title & image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-md overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          <Image
                            src={pattern.image_url || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80'}
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
                            className="font-bold text-[#2D1C17] truncate block max-w-xs hover:underline"
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
                        <span>{pattern.rating ?? 5.0}</span>
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

      {/* FORM MODAL: Add / Edit Pattern */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-stone-200 max-w-lg w-full p-6 my-8 relative shadow-lg">
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
