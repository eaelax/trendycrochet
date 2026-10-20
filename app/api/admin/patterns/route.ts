import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPatterns,
  createPattern,
  updatePattern,
  deletePattern,
  resetToDefaults,
  saveAllPatterns,
} from '@/lib/storage';

const EXPECTED_SECRET = process.env.ADMIN_SECRET_KEY || 'BlackCanonerEoser#15';

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
      image_url: body.image_url || 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
      pdf_size: body.pdf_size || '3.5 MB',
      difficulty_tag: body.difficulty_tag || 'Beginner Friendly',
      cpa_locker_url: body.cpa_locker_url,
      gumroad_url: body.gumroad_url || '',
      is_hot: Boolean(body.is_hot),
      is_best_seller: Boolean(body.is_best_seller),
      is_published: body.is_published ?? true,
      rating: body.rating !== undefined ? Number(body.rating) : 5,
      reviews_count: body.reviews_count !== undefined ? Number(body.reviews_count) : 128,
      description: body.description,
    });

    return NextResponse.json({ success: true, pattern: created }, { status: 201 });
  } catch (error) {
    console.error('Error in patterns API POST:', error);
    return NextResponse.json({ error: 'Failed to process pattern request' }, { status: 500 });
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
      description: body.description,
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
