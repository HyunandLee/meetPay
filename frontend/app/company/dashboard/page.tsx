"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

type CompanyProfile = {
  id: string;
  company_name: string;
  contact_name: string;
  description: string;
  industry: string;
  wallet_address: string;
  logo_url: string;
  seeking_people: string;
  average_salary: number | null;
  average_age: number | null;
  strengths: string;
  benefits: string;
};

export default function CompanyDashboard() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("company")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }

    load();
  }, []);

  if (loading)
    return <p className="text-center mt-20 text-gray-500">Loading...</p>;

  if (!profile)
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <div className="bg-white p-8 shadow-xl rounded-xl text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">🏢 プロフィール未登録</h1>
          <p className="text-gray-600 mb-6">まずは企業プロフィールを作成してください。</p>

          <Link
            href="/company/profile"
            className="inline-block bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            プロフィールを作成する ✏️
          </Link>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          🏢 {profile.company_name}
        </h1>

        {/* ---- メニューエリア ---- */}
        <div className="mt-10 grid grid-cols-1 gap-4">

          {/* 学生を探す */}
          <DashboardButton
            href="/company/students"
            label="🔍 学生を探す"
            color="from-blue-500 to-blue-700"
          />

          {/* チャットへ */}
          <DashboardButton
            href="/company/chat"
            label="💬 チャット"
            color="from-amber-500 to-orange-600"
          />

          {/* 送金履歴 */}
          <DashboardButton
            href="/company/offers"
            label="📜 送金（オファー）履歴"
            color="from-gray-600 to-gray-800"
          />

          {/* 新規オファー送信 */}
          <DashboardButton
            href="/company/offer-send"
            label="🎁 学生にオファーを送る"
            color="from-green-500 to-emerald-600"
          />

          {/* プロフィール編集 */}
          <DashboardButton
            href="/company/profile"
            label="✏️ プロフィールを編集"
            color="from-purple-600 to-indigo-600"
          />

        </div>

        {/* 会社概要 */}
        <div className="bg-white shadow-xl rounded-xl p-6 mb-8 mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            📄 会社概要
          </h2>

          <InfoRow label="業界" value={profile.industry} />
          <InfoRow label="平均年齢" value={profile.average_age?.toString() ?? "未設定"} />
          <InfoRow label="平均年収" value={profile.average_salary?.toString() ?? "未設定"} />
          <InfoRow label="強み" value={profile.strengths} />
        </div>

        {/* 紹介文 */}
        <SectionBlock title="💬 会社の紹介" value={profile.description} />

        {/* 求める人物像 */}
        <SectionBlock title="👥 求める人物像" value={profile.seeking_people} />

        {/* 福利厚生 */}
        <SectionBlock title="🎁 福利厚生" value={profile.benefits} />


      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-800">{value || "未設定"}</span>
    </div>
  );
}

function SectionBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">{title}</h2>
      <p className="text-gray-700 whitespace-pre-line">
        {value || "（未入力）"}
      </p>
    </div>
  );
}

function DashboardButton({
  href,
  label,
  color,
}: {
  href: string;
  label: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className={`block text-center py-4 rounded-xl text-white font-semibold text-lg shadow bg-gradient-to-r ${color} hover:opacity-90 transition`}
    >
      {label}
    </Link>
  );
}
