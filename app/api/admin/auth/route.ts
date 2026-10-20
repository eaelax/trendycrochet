import { NextRequest, NextResponse } from 'next/server';

const EXPECTED_SECRET = process.env.ADMIN_SECRET_KEY || 'BlackCanonerEoser#15';

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
      token: EXPECTED_SECRET,
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
  const authHeader = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  const isAuthenticated = Boolean(
    (token && token === EXPECTED_SECRET) || (authHeader && authHeader === EXPECTED_SECRET)
  );

  return NextResponse.json({
    authenticated: isAuthenticated,
  });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('admin_auth_token');
  return response;
}
