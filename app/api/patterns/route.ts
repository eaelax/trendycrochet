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
