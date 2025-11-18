// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await pool.connect();
        try {
          const query = 'SELECT * FROM users WHERE email = $1';
          const { rows } = await client.query(query, [credentials.email]);
          const user = rows[0];

          if (!user) return null;

          const isPasswordCorrect = credentials.password === user.password;
          if (!isPasswordCorrect) return null;
          
          const hasCredentials = !!(user.aws_access_key && user.aws_secret_key && user.google_api_key && user.aws_region);

          // --- SỬA LỖI TẠI ĐÂY ---
          // Trả về một đối tượng đầy đủ, khớp với `interface User` trong file types/next-auth.d.ts
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            aws_access_key: user.aws_access_key,
            aws_secret_key: user.aws_secret_key,
            aws_region: user.aws_region,
            google_api_key: user.google_api_key,
            is_demo: user.is_demo,
            hasCredentials,
          } as User; // Dùng as User để TypeScript xác nhận

        } catch (error) {
          console.error('Lỗi khi xác thực:', error);
          return null;
        } finally {
          client.release();
        }
      },
    }),
  ],
  callbacks: {
    // Callback `jwt` nhận `user` object từ `authorize` trong lần đăng nhập đầu tiên
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Truyền tất cả các trường từ `user` object vào `token`
        const u = user as any; // Ép kiểu để dễ truy cập
        token.id = u.id;
        token.aws_access_key = u.aws_access_key;
        token.aws_secret_key = u.aws_secret_key;
        token.aws_region = u.aws_region;
        token.google_api_key = u.google_api_key;
        token.is_demo = u.is_demo;
        token.hasCredentials = u.hasCredentials;
      }
      
      // Khi session được cập nhật từ client (sau khi lưu credentials)
      if (trigger === "update" && session?.hasCredentials) {
         token.hasCredentials = session.hasCredentials;
      }

      return token;
    },
    // Callback `session` nhận dữ liệu từ `token` để gửi đến client
    async session({ session, token }) {
      if (token && session.user) {
        // Gán tất cả các trường từ `token` vào `session.user`
        const u = session.user as any; // Ép kiểu để dễ gán
        u.id = token.id;
        u.aws_access_key = token.aws_access_key;
        u.aws_secret_key = token.aws_secret_key;
        u.aws_region = token.aws_region;
        u.google_api_key = token.google_api_key;
        u.is_demo = token.is_demo;
        u.hasCredentials = token.hasCredentials;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };