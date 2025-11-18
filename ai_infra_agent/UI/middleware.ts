// middleware.ts (Đã sửa lỗi)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Danh sách các đường dẫn không yêu cầu xác thực
const publicPaths = ['/auth/signin', '/auth/signup', '/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bỏ qua middleware cho các đường dẫn public
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Kiểm tra token cho tất cả các đường dẫn còn lại (các đường dẫn được bảo vệ)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Nếu không có token, chuyển hướng đến trang đăng nhập
  if (!token) {
    const loginUrl = new URL('/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Nếu có token, cho phép truy cập
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * Điều này đảm bảo middleware CHỈ chạy trên các trang (pages),
     * không chạy trên các API call hoặc các file tài nguyên.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};