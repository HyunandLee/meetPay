"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function CompanyLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function login() {
    console.log("▶ Company logging in:", email);
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: 'ethereum',
      statement: 'Please sign this message to confirm your identity.',
    })

    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email,
    //   password,
    // });

    // console.log("📌 login result:", { data, error });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    console.log("🔑 user:", data.user);

    router.push("/company_legacy/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🏢 企業ログイン
        </h1>

        
        {/* Email */}
        {/* <label className="font-semibold block text-gray-900">Email</label>
        <input
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="company@example.com"
        /> */}

        {/* Password */}
        {/* <label className="font-semibold block text-gray-900">Password</label>
        <input
          type="password"
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        /> */}

        {/* Error表示 */}
        {errorMsg && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-xl border border-red-200">
            {errorMsg}
          </p>
        )}

        {/* Login button */}
        <button
          onClick={login}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
        >
          ログイン
        </button>

        {/* リンク */}
        <p className="text-center text-gray-600 mt-4">
          アカウントをお持ちでないですか？{" "}
          <a href="/company_legacy/register" className="text-blue-600 underline">
            新規登録はこちら
          </a>
        </p>
      </div>
    </main>
  );
}
