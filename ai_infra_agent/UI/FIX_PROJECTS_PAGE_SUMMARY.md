# 🔧 Fix: projects/page.tsx - NextAuth Integration

## 🚨 Vấn Đề Ban Đầu

File `app/dashboard/projects/page.tsx` được báo lỗi:
```
page.tsx:29 No user is authenticated. Cannot fetch scripts.
```

### Root Cause (Nguyên Nhân Gốc)

File này sử dụng **Supabase Auth Client** (`createClientComponentClient`) để lấy user:

```typescript
// ❌ CÁCH CŨ - Supabase Auth
const supabase = createClientComponentClient();
const { data: { user } } = await supabase.auth.getUser();
```

**NHƯ​NG** phần còn lại của app đã chuyển sang **NextAuth** để xác thực user:

```typescript
// ✅ CÁCH MỚI - NextAuth  
const { data: session } = useSession();
const userId = (session?.user as any)?.id;
```

**Kết quả:** File `projects/page.tsx` không thể lấy user từ Supabase Auth vì app không sử dụng Supabase Auth nữa → log "No user is authenticated"

---

## ✅ Cách Sửa

### Thay Đổi 1: Import NextAuth Session Hook

**Trước:**
```typescript
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
```

**Sau:**
```typescript
import { useSession } from "next-auth/react"
import { getInfrastructureHistoryForCurrentUser } from "@/lib/actions/infrastructure.actions"
import { deleteInfrastructureHistory } from "@/lib/actions/infrastructure.actions"
```

### Thay Đổi 2: Fetch Data qua Server Action (không phải direct Supabase Client)

**Trước:**
```typescript
const fetchScriptsFromDB = async (): Promise<Script[]> => {
  const supabase = createClientComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.warn("No user is authenticated. Cannot fetch scripts.");
    return [];
  }
  
  const { data, error } = await supabase
    .from('infrastructure')
    .select('id, type, created_at')
    .eq('user_id', user.id)
    // ...
}
```

**Sau:**
```typescript
const fetchScriptsFromDB = async (): Promise<Script[]> => {
  try {
    // ✅ Sử dụng server action với NextAuth session
    const data = await getInfrastructureHistoryForCurrentUser();
    
    return data.map((script) => ({
      id: script.id,
      type: script.type,
      created: new Date(script.created_at),
    }));
  } catch (error: any) {
    console.error("Error fetching scripts:", error.message);
    throw new Error("Failed to fetch scripts from the database.");
  }
}
```

**Tại Sao?**
- `getInfrastructureHistoryForCurrentUser()` là server action (file `lib/actions/infrastructure.actions.ts`)
- Nó dùng `getServerSession(authOptions)` để lấy NextAuth session **trên server**
- Server có quyền truy cập JWT token từ NextAuth
- Nó tự động xác thực user và fetch dữ liệu của user đó

### Thay Đổi 3: Update Component để Check Auth Status

**Trước:**
```typescript
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchScriptsFromDB();
      setScripts(data);
    } catch (e) {
      setError("Failed to load scripts.");
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

**Sau:**
```typescript
const { data: session, status } = useSession();  // ✅ Thêm này

useEffect(() => {
  const loadData = async () => {
    try {
      // ✅ Kiểm tra auth status trước
      if (status === "unauthenticated") {
        setError("Please sign in to view your scripts.");
        setLoading(false);
        return;
      }

      if (status !== "authenticated") {
        // Still loading session
        return;
      }

      setLoading(true);
      const data = await fetchScriptsFromDB();
      setScripts(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load scripts.");
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [status]);  // ✅ Depend on status change
```

**Tại Sao?**
- `status` có 3 giá trị: `"loading"`, `"authenticated"`, `"unauthenticated"`
- Chỉ fetch khi `status === "authenticated"`
- Trigger re-fetch khi `status` thay đổi

### Thay Đổi 4: Sửa Delete Handler

**Trước:**
```typescript
const handleDelete = async (id: string) => {
  if (confirm(`Are you sure you want to delete script ${id}?`)) {
    const supabase = createClientComponentClient();
    const { error } = await supabase
      .from('infrastructure')
      .delete()
      .match({ id: id });
      
    if (error) {
      alert(`Failed to delete script: ${error.message}`);
    } else {
      setScripts(prev => prev.filter(s => s.id !== id));
      alert(`Deleted script: ${id}`);
    }
  }
};
```

**Sau:**
```typescript
const handleDelete = async (id: string) => {
  if (confirm(`Are you sure you want to delete script ${id}?`)) {
    try {
      // ✅ Dùng server action để delete
      const result = await deleteInfrastructureHistory(id);
      
      if (!result.success) {
        alert(`Failed to delete script: ${result.error}`);
      } else {
        setScripts(prev => prev.filter(s => s.id !== id));
        alert(`Deleted script: ${id}`);
      }
    } catch (error: any) {
      alert(`Error deleting script: ${error.message}`);
    }
  }
};
```

**Tại Sao?**
- `deleteInfrastructureHistory()` là server action đã implement sẵn
- Nó tự động check NextAuth session để xác thực user
- Nó delete chỉ khi record thuộc về user đó (check `user_id`)

---

## 🔄 Flow sau khi fix

```
1. User vào /dashboard/projects
   ↓
2. Component render
   ↓
3. useSession() hook kiểm tra NextAuth session
   ↓
4. Nếu chưa authenticated → show error "Please sign in..."
   ↓
5. Nếu authenticated:
   a. fetchScriptsFromDB() gọi server action
   b. Server action dùng getServerSession() để lấy NextAuth session
   c. Server biết user id từ session.user.id
   d. Fetch từ DB với WHERE user_id = session.user.id
   e. Trả về dữ liệu
   f. Component render table
   ↓
6. User click delete
   a. deleteInfrastructureHistory(id) server action được gọi
   b. Server check session lại để xác thực user
   c. Delete chỉ khi WHERE id = ? AND user_id = session.user.id
   e. Return success
   f. UI update ngay
```

---

## 📝 Server Actions Sử Dụng

### 1. `getInfrastructureHistoryForCurrentUser()`
**File:** `lib/actions/infrastructure.actions.ts`

```typescript
export async function getInfrastructureHistoryForCurrentUser() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('infrastructure')
    .select('id, action, type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error("Could not fetch project history from the database.");
  }
  
  return data || [];
}
```

**Tác Dụng:**
- ✅ Lấy NextAuth session từ server
- ✅ Extract user id từ session
- ✅ Query database với user_id filter
- ✅ Trả về dữ liệu user đó

### 2. `deleteInfrastructureHistory(id)`
**File:** `lib/actions/infrastructure.actions.ts`

```typescript
export async function deleteInfrastructureHistory(id: string) {
  if (!id) {
    return { success: false, error: "Item ID is required." };
  }

  const supabase = createSupabaseServerClient();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  if (!userId) {
    return { success: false, error: "Unauthorized." };
  }

  const { error } = await supabase
    .from('infrastructure')
    .delete()
    .match({ id: id, user_id: userId });  // ✅ Double check user_id

  if (error) {
    return { success: false, error: "Failed to delete item." };
  }
  
  return { success: true };
}
```

**Tác Dụng:**
- ✅ Server-side delete với NextAuth authentication
- ✅ Verify user_id khớp (bảo vệ chống tấn công)
- ✅ RLS policies trên DB cũng check user_id (double security)

---

## 🎯 Tóm Tắt Lợi Ích

| Trước | Sau |
|-------|-----|
| ❌ Dùng Supabase Auth | ✅ Dùng NextAuth (thống nhất) |
| ❌ Direct client query | ✅ Server action (an toàn) |
| ❌ Lỗi "No user" | ✅ Proper session check |
| ❌ No auth verification | ✅ Double security (server + RLS) |
| ❌ Manual fetch logic | ✅ Reusable server actions |

---

## ✨ Kết Quả

Sau khi fix:
1. ✅ Không còn log "No user is authenticated"
2. ✅ Dữ liệu fetch thành công với user từ NextAuth session
3. ✅ Delete hoạt động an toàn với server-side auth check
4. ✅ Toàn bộ app dùng NextAuth thống nhất
5. ✅ Được bảo vệ bởi NextAuth + Supabase RLS policies
