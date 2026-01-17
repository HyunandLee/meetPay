"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BackToDashboard from "@/components/BackToDashboard";
import { supabase } from "@/utils/supabaseClient";

type StudentProfile = {
  id: string;
  name: string | null;
  university: string | null;
  faculty: string | null;
  grade: string | null;
  skills: string | null;
  about: string | null;
  wallet_address: string | null;
  icon_url: string | null;
};

export default function StudentProfileViewPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn("failed to load user", userError);
        setError("ログイン情報の取得に失敗しました。");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("ログインが必要です。");
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      if (profileError) {
        console.warn("failed to load student profile", profileError);
        setError("学生プロフィールの取得に失敗しました。");
        setLoading(false);
        return;
      }

      setProfile((profileData ?? null) as StudentProfile | null);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  if (error)
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-900">
        <div className="bg-white p-8 shadow-xl rounded-xl text-center space-y-4">
          <h1 className="text-2xl font-bold">読み込みに失敗しました</h1>
          <p className="text-gray-600">{error}</p>
          <Link
            href="/student/login"
            className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            ログインへ
          </Link>
        </div>
      </main>
    );

  if (!profile)
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-900">
        <div className="bg-white p-8 shadow-xl rounded-xl text-center space-y-4">
          <h1 className="text-2xl font-bold">🎓 プロフィール未登録</h1>
          <p className="text-gray-600">学生プロフィールを作成してください。</p>
          <Link
            href="/student/profile"
            className="inline-block bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            プロフィールを作成する ✏️
          </Link>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <BackToDashboard href="/student/dashboard" />

        <div className="flex items-center gap-4">
          {profile.icon_url ? (
            <img
              src={profile.icon_url}
              alt={`${profile.name ?? "学生"}のアイコン`}
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">🎓 {profile.name ?? "学生プロフィール"}</h1>
            <p className="text-sm text-gray-600">登録プロフィールの内容</p>
          </div>
        </div>

        <div className="bg-white p-6 shadow-xl rounded-xl space-y-6">
          <ProfileField label="🧑‍🎓 名前" value={profile.name} />
          <ProfileField label="🏫 大学" value={profile.university} />
          <ProfileField label="📘 学部・学科" value={profile.faculty} />
          <ProfileField label="🎒 学年" value={profile.grade} />
          <ProfileField label="💡 スキル" value={profile.skills} />
          <ProfileField label="📝 自己紹介（ガクチカ）" value={profile.about} multiline />
          <ProfileField label="💳 ウォレットアドレス" value={profile.wallet_address} className="break-all text-sm" />
          <ProfileField label="🖼 アイコンURL" value={profile.icon_url} className="break-all text-sm" />
        </div>
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
  multiline,
  className,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
  className?: string;
}) {
  const displayValue = value && value.trim() ? value : "未登録";
  return (
    <div>
      <p className="font-semibold text-gray-700">{label}</p>
      <p
        className={`mt-1 text-gray-900 ${multiline ? "whitespace-pre-wrap" : ""} ${className ?? ""}`}
      >
        {displayValue}
      </p>
    </div>
  );
}
