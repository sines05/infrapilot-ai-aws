// infrastructure.actions.ts

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface SaveParams {
  userId: string;
  action: string;
  type: string;
  description: string;
}

export async function saveExecutionResult(params: SaveParams) {
  console.log("A. [SERVER ACTION] Received request with params:", params);

  const { userId, action, type, description } = params;

  if (!userId || !action || !description) {
    console.error("B. [SERVER ACTION] Validation failed: Missing required fields.");
    return { success: false, error: "Missing required fields." };
  }
  
  const supabase = createSupabaseServerClient();

  try {
    const dataToInsert = {
        // id: uuidv4(), // Bỏ đi nếu cột id trong Supabase đã có giá trị mặc định `gen_random_uuid()`
        user_id: userId,
        action: action,
        type: type,
        description: description,
        // created_at: new Date().toISOString(), // Bỏ đi nếu cột created_at có giá trị mặc định là `now()`
    };

    console.log("C. [SERVER ACTION] Attempting to insert into 'infrastructure' table with data:", dataToInsert);
    
    const { data, error } = await supabase
      .from('infrastructure')
      .insert(dataToInsert)
      .select() // .select() rất quan trọng để Supabase trả về dữ liệu vừa insert
      .single(); // .single() để lấy về 1 object thay vì một mảng chỉ có 1 phần tử

    // Log chi tiết phản hồi từ Supabase
    console.log("D. [SERVER ACTION] Supabase response received.");
    console.log("D.1. [SERVER ACTION] Data returned:", data);
    console.log("D.2. [SERVER ACTION] Error returned:", error);

    if (error) {
      console.error("E. [SERVER ACTION] Supabase Insert Error:", error.message);
      // Ném lỗi để block catch bên dưới bắt được
      throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
    }
    
    // Kiểm tra xem dữ liệu trả về có thật sự tồn tại không
    if (!data) {
        console.warn("F. [SERVER ACTION] Insert operation returned no data and no error. This might be due to RLS (Row Level Security).");
        throw new Error("Data was not saved, and no explicit error was returned. Please check database policies (RLS).");
    }

    console.log("G. [SERVER ACTION] Execution result saved successfully. Inserted data:", data);
    return { success: true, data };

  } catch (error: any) {
    console.error("H. [SERVER ACTION] Critical error in saveExecutionResult:", error.message);
    return { 
      success: false, 
      error: error.message || "An unknown database error occurred." 
    };
  }
}

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
    console.error("Supabase fetch error:", error.message);
    throw new Error("Could not fetch project history from the database.");
  }
  
  return data || [];
}

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
    .match({ id: id, user_id: userId });

  if (error) {
    console.error("Supabase delete error:", error.message);
    return { success: false, error: "Failed to delete item." };
  }
  
  return { success: true };
}