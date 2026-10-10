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

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation state
  const [deletingPattern, setDeletingPattern] = useState<Pattern | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPdfSize, setFormPdfSize] = useState('3.8 MB');
  const [formDifficultyTag, setFormDifficultyTag] = useState('Beginner Friendly');
  const [formCpaLockerUrl, setFormCpaLockerUrl] = useState('');
  const [formGumroadUrl, setFormGumroadUrl] = useState('');
  const [formIsPublished, setFormIsPublished] = useState(true);

  // File Upload
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPatterns = async () => {
    setIsLoadingPatterns(true);
    try {
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
          fetch('/api/admin/patterns')
            .then((r) => r.json())
            .then((pData) => {
              if (active && pData.patterns) {
                setPatterns(pData.patterns);
              }
            })
            .catch(() => {});
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

  const handleSavePattern = async (e: React.FormEvent) => {
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

    setIsSaving(true);
    try {
      const payload = {
        id: editingPattern?.id,
        title: formTitle.trim(),
        slug: formSlug.trim(),
        image_url: formImageUrl.trim() || '/images/hero-crochet.jpg',
        pdf_size: formPdfSize.trim() || '3.5 MB',
        difficulty_tag: formDifficultyTag.trim() || 'Beginner Friendly',
        cpa_locker_url: formCpaLockerUrl.trim(),
        gumroad_url: formGumroadUrl.trim(),
        is_published: formIsPublished,
      };

      const method = editingPattern ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/patterns', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.pattern)) {
        setIsModalOpen(false);
        fetchPatterns();
      } else {
        setFormError(data.error || 'Failed to save pattern.');
      }
    } catch {
      setFormError('Network error while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePattern = async () => {
    if (!deletingPattern) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/patterns?id=${deletingPattern.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeletingPattern(null);
        fetchPatterns();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetSamplePatterns = async () => {
    if (!confirm('Reset all patterns to sample patterns?')) return;
    try {
      const res = await fetch('/api/admin/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        fetchPatterns();
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const copyPinterestLink = async (p: Pattern) => {
    if (typeof window !== 'undefined') {
      const pageUrl = `${window.location.origin}/pattern/${p.slug}`;
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

  // Secret Key Login Gate
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

          <div className="mt-6 pt-4 border-t border-stone-100 text-center text-[11px] text-stone-400">
            Passcode: <code className="text-stone-600 font-mono">crochet2025</code>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
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
            Hidden Route: <code className="font-mono text-stone-700">/trendycrochetpatternsadmin</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E65F43] hover:bg-[#c94934] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
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
                  <th className="py-3 px-4">PDF Size</th>
                  <th className="py-3 px-4">Difficulty Tag</th>
                  <th className="py-3 px-4">CPA & Gumroad Links</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {patterns.map((pattern) => (
                  <tr key={pattern.id} className="hover:bg-stone-50/50">
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
                            href={`/pattern/${pattern.slug}`}
                            target="_blank"
                            className="font-bold text-[#2D1C17] hover:text-[#E65F43] truncate block max-w-xs"
                          >
                            {pattern.title}
                          </Link>
                          <span className="text-[11px] text-stone-400 font-mono truncate block">
                            /{pattern.slug}
                          </span>
                        </div>
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
                          href={`/pattern/${pattern.slug}`}
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
              Enter the pattern details and download links.
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
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#E65F43] hover:bg-[#c94934] text-white font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : editingPattern ? 'Save Changes' : 'Create Pattern'}
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
                disabled={isDeleting}
                className="px-3.5 py-2 bg-[#E65F43] text-white font-bold text-xs rounded-lg hover:bg-[#c94934] cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
