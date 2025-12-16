"use server";

import { getServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const serverSupabase = await getServerSupabase();
  const { error } = await serverSupabase.auth.signOut();
  if (error) {
    console.error('Error:', error);
  }
  revalidatePath("/company/login");
  redirect("/company/login");
}