
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { serialize } from 'cookie';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const VIEWER_PASSWORD = process.env.VIEWER_PASSWORD || 'viewer123';

export async function POST(request: Request) {
  const { password } = await request.json();

  let role = null;
  let redirectPath = '';

  if (password === ADMIN_PASSWORD) {
    role = 'admin';
    redirectPath = '/admin';
  } else if (password === VIEWER_PASSWORD) {
    role = 'viewer';
    redirectPath = '/viewer';
  }

  if (role) {
    const token = await new SignJWT({ role })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(SECRET_KEY);

    const serialized = serialize('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return new Response(JSON.stringify({ success: true, redirectPath }), {
      status: 200,
      headers: { 'Set-Cookie': serialized },
    });
  } else {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }
}
