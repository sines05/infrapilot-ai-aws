// File: app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';

// Tạo một connection pool để kết nối tới Supabase
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
      // Logic xác thực bằng so sánh mật khẩu plain text
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await pool.connect();
        try {
          // 1. Tìm người dùng bằng email
          const query = 'SELECT * FROM users WHERE email = $1';
          const { rows } = await client.query(query, [credentials.email]);
          const user = rows[0];

          // Nếu không tìm thấy user
          if (!user) {
            return null;
          }

          // 2. So sánh trực tiếp mật khẩu người dùng nhập với mật khẩu trong DB
          // **CẢNH BÁO**: Phương pháp này KHÔNG AN TOÀN
          const isPasswordCorrect = credentials.password === user.password;
          // Quan trọng: Đảm bảo 'user.password' là tên cột chính xác trong DB của bạn

          // Nếu mật khẩu không khớp
          if (!isPasswordCorrect) {
            return null;
          }

          // 3. Nếu đăng nhập thành công, trả về object user
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            aws_access_key: user.aws_access_key,
            aws_secret_key: user.aws_secret_key,
          };

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
    // Các callbacks này giữ nguyên, không cần thay đổi
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.aws_access_key = (user as any).aws_access_key;
        token.aws_secret_key = (user as any).aws_secret_key;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).aws_access_key = token.aws_access_key;
        (session.user as any).aws_secret_key = token.aws_secret_key;
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