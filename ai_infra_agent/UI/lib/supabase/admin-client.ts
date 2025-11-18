// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

// Lấy các biến môi trường cần thiết.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Kiểm tra để đảm bảo các biến môi trường đã được thiết lập.
// Việc này giúp tránh các lỗi khó hiểu khi triển khai.
if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in .env.local');
}

/**
 * Supabase Admin Client
 * 
 * Client này được khởi tạo với `service_role_key`, cho phép nó bỏ qua
 * tất cả các chính sách Row Level Security (RLS).
 * 
 * CẢNH BÁO:
 * - Chỉ sử dụng client này ở phía server (API Routes, Server Actions, getServerSideProps).
 * - KHÔNG BAO GIỜ import hoặc sử dụng file này trong các component phía client ('use client').
 *   Làm vậy sẽ làm lộ key bí mật của bạn và gây ra rủi ro bảo mật nghiêm trọng.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Tắt tính năng tự động làm mới token vì chúng ta đang dùng service key
    autoRefreshToken: false,
    persistSession: false,
  },
});