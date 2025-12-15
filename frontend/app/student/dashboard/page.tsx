"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

type StudentProfile = {
  id: string;
  name: string;
  university: string;
  faculty: string;
  grade: string;
  skills: string;
  about: string;
  wallet_address: string;
  icon_url: string;
};

export default function StudentDashboard() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
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
        .from("student")
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
          <h1 className="text-2xl font-bold mb-4">🎓 プロフィール未登録</h1>
          <p className="text-gray-600 mb-6">学生プロフィールを作成してください。</p>

          <Link
            href="/student/profile"
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

        {/* タイトル */}
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-900">
          🎓 {profile.name} さん
        </h1>

        {/* ナビゲーションボタン */}
        <DashboardButton
          label="🎓 自分のプロフィールを見る"
          href="/student/me"
          color="from-blue-500 to-blue-700"
        />

        <DashboardButton
          label="✏️ プロフィールを編集"
          href="/student/profile"
          color="from-purple-500 to-indigo-600"
        />

        <DashboardButton
          label="💌 企業からのオファーを見る"
          href="/student/offers"
          color="from-pink-500 to-red-500"
        />

        <DashboardButton
          label="💬 チャットへ"
          href="/student/chat"
          color="from-orange-500 to-yellow-500"
        />

        <DashboardButton
          label="💼 企業を探す"
          href="/company/search"   // 企業の検索ページ（後で作る）
          color="from-green-500 to-emerald-600"
        />

        {/* プロフィール概要カード */}
        <div className="bg-white shadow-xl rounded-xl p-6 mb-8 mt-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
            📄 自分のプロフィール概要
          </h2>

          <div className="space-y-3">
            <InfoRow label="大学" value={profile.university} />
            <InfoRow label="学部" value={profile.faculty} />
            <InfoRow label="学年" value={profile.grade} />
            <InfoRow label="スキル" value={profile.skills} />
          </div>
        </div>

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

function DashboardButton({
  label,
  href,
  color,
}: {
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <div
        className={`w-full mt-4 p-4 rounded-xl shadow text-white text-lg font-semibold text-center cursor-pointer bg-gradient-to-r ${color} hover:opacity-90 transition`}
      >
        {label}
      </div>
    </Link>
  );
}
