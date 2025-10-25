
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authToken = request.cookies.get('auth_token')?.value;

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';

  if (!authToken) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(authToken, SECRET_KEY);

    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*', '/viewer/:path*'],
};
