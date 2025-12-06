"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { useState } from "react";

export default function StudentSignup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signup() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "student" }, // ★重要：middlewareが判定
      },
    });

    if (error) return alert(error.message);

    router.push("/student/login");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">

        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🎓 学生アカウント作成
        </h1>

        {/* Email */}
        <label className="font-semibold block text-gray-900 mb-1">
          Email
        </label>
        <input
          className="w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 mb-4"
          value={email}
          placeholder="student@example.com"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <label className="font-semibold block text-gray-900 mb-1">
          Password
        </label>
        <input
          type="password"
          className="w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 mb-6"
          value={password}
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={signup}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
        >
          登録する
        </button>

        <p className="text-center text-gray-600 mt-4">
          すでにアカウントをお持ちですか？{" "}
          <a href="/student/login" className="text-blue-600 underline">
            ログインへ戻る
          </a>
        </p>
      </div>
    </main>
  );
}
