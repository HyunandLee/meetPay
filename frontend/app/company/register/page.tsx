"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { useRouter } from "next/navigation";

export default function CompanyRegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function register() {
    console.log("▶ Register:", email);
    setErrorMsg("");

    // ✨ 1. Supabase の auth にユーザーを作成
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMsg("ユーザー登録に失敗しました");
      return;
    }

    // ✨ 2. company_profiles にプロフィール新規作成
    const { error: insertError } = await supabase
      .from("company_profiles")
      .insert({
        user_id: user.id,
        company_name: companyName,
      });

    if (insertError) {
      setErrorMsg(insertError.message);
      return;
    }

    console.log("🎉 company registered:", user.id);

    // ✨ 3. 登録成功後ダッシュボードへ
    router.push("/company/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="bg-white w-full max-w-lg p-8 rounded-2xl shadow-xl">

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          🏢 企業登録
        </h1>

        {/* Email */}
        <label className="font-semibold block text-gray-900 mt-2">Email</label>
        <input
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="company@example.com"
        />

        {/* Password */}
        <label className="font-semibold block text-gray-900 mt-2">Password</label>
        <input
          type="password"
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {/* Company Name */}
        <label className="font-semibold block text-gray-900 mt-2">Company Name</label>
        <input
          className="w-full p-3 border rounded-xl bg-white text-gray-900 placeholder-gray-400 mb-6"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your Company Inc."
        />

        {/* エラー表示 */}
        {errorMsg && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-xl border border-red-200">
            {errorMsg}
          </p>
        )}

        {/* Register button */}
        <button
          onClick={register}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-lg font-semibold hover:opacity-90 transition"
        >
          登録する
        </button>

        {/* ログインへの導線 */}
        <p className="text-center text-gray-600 mt-4">
          すでにアカウントがありますか？{" "}
          <a href="/company/login" className="text-blue-600 underline">
            ログインはこちら
          </a>
        </p>
      </div>
    </main>
  );
}
