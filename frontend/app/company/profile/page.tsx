"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import BackToDashboard from "@/components/BackToDashboard";

type CompanyProfile = {
  company_name: string;
  contact_name: string;
  description: string;
  industry: string;
  wallet_address: string;
  logo_url: string;
  seeking_people: string;
  average_salary: string;
  average_age: string;
  strengths: string;
  benefits: string;
};

export default function CompanyProfilePage() {
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState<CompanyProfile>({
    company_name: "",
    contact_name: "",
    description: "",
    industry: "",
    wallet_address: "",
    logo_url: "",
    seeking_people: "",
    average_salary: "",
    average_age: "",
    strengths: "",
    benefits: "",
  });

  const [loading, setLoading] = useState(true);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // --- 初期読み込み ---
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      const { data, error } = await supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (error) {
        console.warn("failed to load company profile", error);
      }

      if (data) {
        setProfileId(data.id);

        setForm({
          company_name: data.company_name ?? "",
          contact_name: data.contact_name ?? "",
          description: data.description ?? "",
          industry: data.industry ?? "",
          wallet_address: data.wallet_address ?? "",
          logo_url: data.logo_url ?? "",
          seeking_people: data.seeking_people ?? "",
          average_salary: data.average_salary?.toString() ?? "",
          average_age: data.average_age?.toString() ?? "",
          strengths: data.strengths ?? "",
          benefits: data.benefits ?? "",
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  // --- 保存処理 ---
  async function saveProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return alert("ログインが必要です");

    const payload = {
      ...form,
      user_id: user.id,
      average_salary:
        form.average_salary === "" ? null : Number(form.average_salary),
      average_age: form.average_age === "" ? null : Number(form.average_age),
    };

    let error;

    if (profileId) {
      const res = await supabase
        .from("company_profiles")
        .update(payload)
        .eq("id", profileId);
      error = res.error;
    } else {
      const res = await supabase
        .from("company_profiles")
        .insert(payload)
        .select()
        .single();
      error = res.error;
      if (!error) setProfileId(res.data.id);
    }

    if (error) alert(error.message);
    else alert("保存しました！");
  }

  if (loading)
    return <p className="text-center mt-20 text-gray-500">読み込み中...</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">

        {/* ダッシュボードへ戻る */}
        <BackToDashboard href="/company/dashboard" />

        {/* タイトル */}
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          ✏️ 企業プロフィール編集
        </h1>

        {/* 各フォーム項目 */}
        {(Object.keys(form) as (keyof CompanyProfile)[]).map((key) => (
          <div
            key={key}
            className="bg-white shadow-md rounded-xl p-5 mb-6 border border-gray-200"
          >
            <label className="font-semibold text-gray-900 block mb-2">
              {labelFor(key)}
            </label>

            {textareaKeys.includes(key) ? (
              <textarea
                name={key}
                value={form[key]}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 p-3 rounded-md
                           text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            ) : (
              <input
                name={key}
                value={form[key]}
                onChange={handleChange}
                className="w-full border border-gray-300 p-3 rounded-md
                           text-gray-900 placeholder-gray-400
                           focus:ring-2 focus:ring-indigo-400 outline-none"
              />
            )}
          </div>
        ))}

        <div className="text-center mt-10">
          <button
            onClick={saveProfile}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg shadow hover:opacity-90 transition"
          >
            保存する 🚀
          </button>
        </div>
      </div>
    </main>
  );
}

const textareaKeys = [
  "description",
  "seeking_people",
  "strengths",
  "benefits",
] as (keyof CompanyProfile)[];

function labelFor(key: keyof CompanyProfile): string {
  const labels: Record<keyof CompanyProfile, string> = {
    company_name: "🏢 会社名",
    contact_name: "👤 担当者名",
    description: "💬 会社の紹介",
    industry: "📂 業界",
    wallet_address: "🔑 ウォレットアドレス",
    logo_url: "🖼 ロゴ画像URL",
    seeking_people: "👥 求める人物像",
    average_salary: "💰 平均年収",
    average_age: "🎂 平均年齢",
    strengths: "✨ 強み",
    benefits: "🎁 福利厚生",
  };
  return labels[key];
}
