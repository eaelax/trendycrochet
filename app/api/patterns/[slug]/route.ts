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
