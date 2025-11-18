// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Các đường dẫn công khai, không yêu cầu đăng nhập
const publicPaths = ['/auth/signin', '/auth/signup', '/'];

// Đường dẫn trang credentials duy nhất
const CREDENTIALS_PATH = '/dashboard/credentials';

// Các đường dẫn bị cấm vĩnh viễn đối với user demo
const DEMO_FORBIDDEN_PATHS = ['/dashboard/settings'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bỏ qua các đường dẫn công khai
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Lấy thông tin session từ token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 1. Nếu không có token (chưa đăng nhập), chuyển hướng đến trang signin
  if (!token) {
    const loginUrl = new URL('/auth/signin', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname); // Lưu lại trang muốn vào để redirect sau khi login
    return NextResponse.redirect(loginUrl);
  }

  // Lấy các thông tin tùy chỉnh từ token
  const isDemo = token.is_demo === true;
  const hasCredentials = token.hasCredentials === true;

  // 2. Xử lý logic cho USER DEMO
  if (isDemo) {
    // 2a. Nếu user demo chưa có credentials
    if (!hasCredentials) {
      // Bắt buộc họ phải ở lại trang credentials.
      // Nếu họ cố gắng đi đến bất kỳ trang nào khác, redirect họ về trang credentials.
      if (pathname !== CREDENTIALS_PATH) {
        return NextResponse.redirect(new URL(CREDENTIALS_PATH, req.url));
      }
    } 
    // 2b. Nếu user demo đã có credentials
    else {
      // Kiểm tra xem họ có đang cố truy cập vào một trang bị cấm không.
      if (DEMO_FORBIDDEN_PATHS.includes(pathname)) {
        // Nếu có, redirect họ về một trang an toàn, ví dụ như trang chat.
        return NextResponse.redirect(new URL('/dashboard/chat', req.url));
      }
    }
  }

  // 3. Nếu là người dùng thông thường hoặc user demo đã qua các kiểm tra ở trên, cho phép truy cập.
  return NextResponse.next();
}

// Config matcher để middleware chạy trên các trang cần bảo vệ
export const config = {
  matcher: [
    /*
     * Match tất cả các request path ngoại trừ những cái bắt đầu bằng:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};