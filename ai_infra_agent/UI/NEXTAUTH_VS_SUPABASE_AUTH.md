# 📊 Biểu Đồ: Supabase Auth vs NextAuth

## ❌ CẬP HÌNH CŨ (Supabase Auth - Lỗi)

```
┌─────────────────────────────────────────────────────┐
│  projects/page.tsx (Client Component)               │
│                                                     │
│  const supabase = createClientComponentClient()    │
│  const { user } = await supabase.auth.getUser()    │
│  ❌ Không tìm thấy user → "No user authenticated"  │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Supabase Auth Session (Browser)                    │
│                                                     │
│  ❌ App không lưu session ở Supabase Auth           │
│  ❌ NextAuth tạo session, Supabase không biết       │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Supabase Database                                  │
│                                                     │
│  ❌ Không thể fetch dữ liệu                         │
└─────────────────────────────────────────────────────┘

🔴 RESULT: LỖI "No user is authenticated"
```

---

## ✅ CẬP HÌNH MỚI (NextAuth - Fix)

```
┌─────────────────────────────────────────────────────┐
│  projects/page.tsx (Client Component)               │
│                                                     │
│  const { data: session, status } = useSession()    │
│  if (status === "authenticated") {                 │
│    await fetchScriptsFromDB()  ✅ Call server      │
│  }                                                  │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  NextAuth Session (JWT in Cookie)                   │
│                                                     │
│  ✅ User signed in via NextAuth                    │
│  ✅ JWT token stored in secure cookie              │
│  ✅ status = "authenticated"                       │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Server Action: getInfrastructureHistoryForCurrentUser()
│                                                     │
│  const session = await getServerSession(authOptions)
│  const userId = session?.user?.id  ✅ From JWT     │
│  query db WHERE user_id = userId                   │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Supabase Database (with RLS)                       │
│                                                     │
│  SELECT * FROM infrastructure                      │
│  WHERE user_id = $1  ✅ Filter by authenticated   │
│  AND (RLS policies check) ✅ Double security       │
│                                                     │
│  ✅ Returns user's scripts only                    │
└─────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────┐
│  Client receives data and renders table             │
│                                                     │
│  ✅ Script list shows correctly                    │
└─────────────────────────────────────────────────────┘

🟢 RESULT: HOẠT ĐỘNG BÌNH THƯỜNG ✅
```

---

## 🔐 Security Layers (Bảo Vệ Nhiều Lớp)

```
Layer 1: NextAuth Session
┌────────────────────────────────┐
│ JWT Token in Secure Cookie     │
│ (HttpOnly, SameSite, Secure)   │
│ Only server can read           │
└────────────────────────────────┘
           ↓
Layer 2: Server Action Auth Check
┌────────────────────────────────┐
│ getServerSession() verify JWT   │
│ Extract user id từ token        │
│ Throw error nếu invalid        │
└────────────────────────────────┘
           ↓
Layer 3: Query Filtering
┌────────────────────────────────┐
│ WHERE user_id = $1             │
│ Chỉ return records của user    │
└────────────────────────────────┘
           ↓
Layer 4: RLS (Row Level Security)
┌────────────────────────────────┐
│ Database enforces:             │
│ SELECT: user_id = auth.uid()   │
│ DELETE: user_id = auth.uid()   │
│ UPDATE: user_id = auth.uid()   │
└────────────────────────────────┘

✅ Hacker không thể:
  - Lấy JWT từ browser (HttpOnly)
  - Bypass server auth check
  - Access other user's data
```

---

## 🚀 Comparison Table

| Aspect | ❌ Cũ (Supabase Auth) | ✅ Mới (NextAuth) |
|--------|----------------------|------------------|
| Session | Supabase Auth Session | NextAuth JWT in Cookie |
| Auth Check | Client-side (`getUser()`) | Server-side (`getServerSession()`) |
| Security | Medium (client-side) | High (server-side + JWT) |
| User Data Access | Direct from client | Only via server action |
| RLS Bypass | Possible | Not possible |
| Database Query | Client can construct | Server controls query |
| Error Handling | "No user" message | Proper auth flow |
| Consistency | 2 different auth systems | Single auth system |

---

## 📞 User Action Flow (Chi Tiết)

### 1️⃣ Page Load
```
User visits /dashboard/projects
       ↓
Next.js renders ProjectsPage component
       ↓
useSession() hook runs
       ↓
Check: Is there a valid NextAuth JWT cookie?
       ├─ NO → status = "unauthenticated" → Show error
       ├─ LOADING → status = "loading" → Show loading
       └─ YES → status = "authenticated" → Fetch data
```

### 2️⃣ Data Fetch
```
Component calls fetchScriptsFromDB()
       ↓
Function calls server action: getInfrastructureHistoryForCurrentUser()
       ↓
Server receives request with JWT cookie
       ↓
Server calls getServerSession(authOptions)
       ├─ Validates JWT signature
       ├─ Checks expiration
       ├─ Extracts user.id from token
       └─ Returns session object
       ↓
Server queries: 
  SELECT * FROM infrastructure 
  WHERE user_id = session.user.id
       ↓
Supabase applies RLS policy:
  ├─ Checks: user_id = auth.uid()
  ├─ Ensures RLS policy allows SELECT
  └─ Returns filtered results
       ↓
Server returns data to client
       ↓
Component renders table with scripts
```

### 3️⃣ Delete Action
```
User clicks Trash icon for script ID = "abc-123"
       ↓
handleDelete("abc-123") called
       ↓
Confirm dialog shown
       ↓
User confirms
       ↓
Client calls server action: deleteInfrastructureHistory("abc-123")
       ↓
Server receives request with:
  - id parameter: "abc-123"
  - JWT cookie in headers
       ↓
Server calls getServerSession(authOptions)
       ├─ Validates JWT
       └─ Extracts user.id (e.g., "user-xyz")
       ↓
Server executes:
  DELETE FROM infrastructure
  WHERE id = "abc-123"
    AND user_id = "user-xyz"
       ↓
Supabase applies RLS policy:
  ├─ Checks: user_id = auth.uid()
  ├─ Prevents deleting other user's records
  └─ Confirms delete
       ↓
Server returns { success: true }
       ↓
Client removes item from local state
       ↓
UI updates immediately
```

---

## 🎯 Key Takeaways

1. **NextAuth JWT > Supabase Auth for this app**
   - App đã migrate toàn bộ sang NextAuth
   - `projects/page.tsx` phải follow cùng pattern

2. **Server Actions are secure**
   - `getServerSession()` verify JWT server-side
   - Client không thể giả mạo user

3. **RLS + Server Filter = Double Security**
   - Server filters: `WHERE user_id = session.user.id`
   - Database enforces: RLS policy
   - Hacker phải bypass cả 2

4. **Never trust client session**
   - Always re-validate on server
   - `getServerSession()` re-validates JWT
   - RLS policy on DB re-validates again

5. **Consistency matters**
   - Mọi page dùng NextAuth
   - Mọi query dùng server action
   - Mọi delete/update dùng server action
   - → Secure, maintainable, predictable
