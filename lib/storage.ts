import fs from 'fs';
import path from 'path';
import { Pattern, PatternFormData } from './types';
import { INITIAL_PATTERNS } from './initial-data';
import { getSupabaseClient } from './supabase';

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'patterns.json');

let memoryPatterns: Pattern[] = [...INITIAL_PATTERNS];

function ensureFileStore(): Pattern[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }
    if (!fs.existsSync(DATA_FILE)) {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_PATTERNS, null, 2), 'utf-8');
      } catch {}
      return memoryPatterns.length > 0 ? memoryPatterns : INITIAL_PATTERNS;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
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
    return memoryPatterns.length > 0 ? memoryPatterns : INITIAL_PATTERNS;
  } catch (err) {
    console.warn('File store error, falling back to memory:', err);
    return memoryPatterns.length > 0 ? memoryPatterns : INITIAL_PATTERNS;
  }
}

function saveFileStore(patterns: Pattern[]) {
  memoryPatterns = patterns;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(patterns, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Failed to persist patterns to file (in-memory preserved):', err);
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
    image_url: input.image_url.trim() || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
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

  const updatedList = [newPattern, ...currentList];
  saveFileStore(updatedList);
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
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
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
      const { data: existing } = await sb.from('patterns').select('id');
      if (existing && Array.isArray(existing)) {
        const newIds = new Set(patterns.map((p) => p.id));
        const toDelete = existing
          .filter((item: { id: string }) => !newIds.has(item.id))
          .map((item: { id: string }) => item.id);
        if (toDelete.length > 0) {
          await sb.from('patterns').delete().in('id', toDelete);
        }
      }
      const { error } = await sb.from('patterns').upsert(patterns, { onConflict: 'id' });
      if (!error) {
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
