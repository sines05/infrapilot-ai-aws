// File: types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  // Mở rộng interface User để bao gồm tất cả các trường tùy chỉnh
  interface User {
    id: string;
    aws_access_key: string | null;
    aws_secret_key: string | null;
    aws_region: string | null;
    google_api_key: string | null;
    is_demo?: boolean; // Demo status
    hasCredentials?: boolean; // Credential status
  }

  // Mở rộng interface Session để user object trên client có các trường tùy chỉnh
  interface Session {
    user: {
      id: string;
      aws_access_key: string | null;
      aws_secret_key: string | null;
      aws_region: string | null;
      google_api_key: string | null;
      is_demo?: boolean;
      hasCredentials?: boolean;
    } & DefaultSession['user']; // Giữ lại các trường mặc định như name, email, image
  }
}

declare module 'next-auth/jwt' {
  // Mở rộng JWT để chứa tất cả các trường tùy chỉnh
  interface JWT {
    id: string;
    aws_access_key: string | null;
    aws_secret_key: string | null;
    aws_region: string | null;
    google_api_key: string | null;
    is_demo?: boolean;
    hasCredentials?: boolean;
  }
}