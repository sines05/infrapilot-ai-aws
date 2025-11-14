// File: types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      aws_access_key: string;
      aws_secret_key: string;
    } & DefaultSession['user'];
  }

  interface User {
      id: string;
      aws_access_key: string;
      aws_secret_key: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    aws_access_key: string;
    aws_secret_key: string;
  }
}