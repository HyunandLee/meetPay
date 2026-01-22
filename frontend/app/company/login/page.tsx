"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function CompanyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function login() {
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // ログイン成功 → ダッシュボードへ
    router.push("/company/dashboard");
  }

  return (
    <main className="min-h-screen bg-sky-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🏢 企業ログイン
        </h1>

        <label className="font-semibold block text-gray-900">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
        />

        <label className="font-semibold block text-gray-900">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-6"
        />

        {errorMsg && (
          <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
        )}

        <button
          onClick={login}
          className="w-full py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
        >
          ログイン
        </button>

        <p className="text-center text-gray-600 mt-4">
          アカウントがありませんか？{" "}
          <a href="/company/register" className="text-blue-600 underline">
            新規作成
          </a>
        </p>
      </div>
    </main>
  );
}
