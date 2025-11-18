import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Pool } from 'pg';

// Tạo connection pool đến Supabase / PostgreSQL
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
          // Tìm user theo email
          const query = 'SELECT * FROM users WHERE email = $1';
          const { rows } = await client.query(query, [credentials.email]);
          const user = rows[0];

          if (!user) return null;

          // So sánh mật khẩu (cảnh báo: plain text, nên dùng bcrypt)
          const isPasswordCorrect = credentials.password === user.password;
          if (!isPasswordCorrect) return null;

          // Trả về object user
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            aws_access_key: user.aws_access_key,
            aws_secret_key: user.aws_secret_key,
            aws_region: user.aws_region,       
            google_api_key: user.google_api_key,
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;               
        token.aws_access_key = (user as any).aws_access_key;
        token.aws_secret_key = (user as any).aws_secret_key;
        token.aws_region = (user as any).aws_region;  
        token.google_api_key = (user as any).google_api_key;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).name = token.name;          
        (session.user as any).aws_access_key = token.aws_access_key;
        (session.user as any).aws_secret_key = token.aws_secret_key;
        (session.user as any).aws_region = token.aws_region; 
        (session.user as any).google_api_key = token.google_api_key;
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
