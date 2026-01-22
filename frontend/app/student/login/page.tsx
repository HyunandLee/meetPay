"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function StudentLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    console.log("▶ Logging in:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log("📌 login result:", { data, error });

    if (error) {
      alert(error.message);
      return;
    }

    // 誰かログインした？
    console.log("🔑 user:", data.user);

    // ユーザーが取れたら dashboard へ
    router.push("/student/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">

        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🎓 学生ログイン
        </h1>

        <label className="font-semibold block text-gray-900">Email</label>
        <input
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="font-semibold block text-gray-900">Password</label>
        <input
          type="password"
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-6"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
        >
          ログイン
        </button>

        <p className="text-center text-gray-600 mt-4">
          アカウントをお持ちでないですか？{" "}
          <a href="/student/signup" className="text-blue-600 underline">
            新規登録はこちら
          </a>
        </p>
      </div>
    </main>
  );
}
