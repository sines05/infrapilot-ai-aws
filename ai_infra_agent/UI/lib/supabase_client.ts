import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // dùng service key để đọc bảng users
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
