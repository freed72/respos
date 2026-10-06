import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'trp_admin_session';

// Simple HMAC-like hashing or token encoder
function createSessionToken(username: string): string {
  const payload = {
    username,
    createdAt: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function verifySessionToken(token: string): { username: string; createdAt: number } | null {
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf-8');
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.username) {
      // Valid for 7 days
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.createdAt < maxAge) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const session = verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        username: session.username,
        role: 'SUPER_ADMIN',
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'royalpalette2026';

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (username.trim() !== expectedUsername.trim() || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid executive credentials' },
        { status: 401 }
      );
    }

    const token = createSessionToken(username.trim());
    const cookieStore = await cookies();

    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Authenticated successfully',
      user: {
        username: username.trim(),
        role: 'SUPER_ADMIN',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Authentication failed due to server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Logout error' }, { status: 500 });
  }
}
