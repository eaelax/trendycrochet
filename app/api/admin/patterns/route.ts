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
      is_published: body.is_published ?? true,
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
      is_published: body.is_published,
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
