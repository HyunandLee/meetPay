"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function CompanyRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function register() {
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      // ロールを付与したい場合は metadata を追加することも可能
      // options: { data: { role: "company" } },
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    alert("登録完了！ログインしてください。");
    router.push("/company/login");
  }

  return (
    <main className="min-h-screen bg-sky-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🏢 企業アカウント作成
        </h1>

        <label className="font-semibold block text-gray-900 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 mb-4"
          placeholder="company@example.com"
        />

        <label className="font-semibold block text-gray-900 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white text-gray-900 placeholder-gray-400 mb-6"
          placeholder="••••••••"
        />

        {errorMsg && (
          <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
        )}

        <button
          onClick={register}
          className="w-full py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
        >
          登録する
        </button>

        <p className="text-center text-gray-600 mt-4">
          すでにアカウントをお持ちですか？{" "}
          <a href="/company/login" className="text-blue-600 underline">
            ログインへ戻る
          </a>
        </p>
      </div>
    </main>
  );
}
