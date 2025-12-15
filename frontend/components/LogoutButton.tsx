"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function LogoutButton({ link }: { link: string }) {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push(link);
  }

  return (
    <button onClick={logout} className="block text-center m-4 p-4 rounded-xl text-white font-semibold shadow bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition">ログアウト</button>
  );
}