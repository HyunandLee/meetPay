"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

export default function StudentProfilePublicPage() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id") ?? searchParams.get("studentId");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!studentId) {
        setError("学生IDが指定されていません。");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: profileError } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (profileError) {
        console.warn("failed to load student profile", profileError);
        setError("学生プロフィールの取得に失敗しました。");
        setLoading(false);
        return;
      }

      if (!data) {
        setError("学生プロフィールが見つかりません。");
        setLoading(false);
        return;
      }

      setProfile(data as StudentProfile);
      setLoading(false);
    }

    load();
  }, [studentId]);

  if (loading) return <p className="text-center mt-10 text-gray-500">Loading...</p>;

  if (error)
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-900">
        <div className="bg-white p-8 shadow-xl rounded-xl text-center space-y-4">
          <h1 className="text-2xl font-bold">読み込みに失敗しました</h1>
          <p className="text-gray-600">{error}</p>
          <Link
            href="/company/students"
            className="inline-block bg-linear-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            学生検索に戻る
          </Link>
        </div>
      </main>
    );

  if (!profile)
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6 text-gray-900">
        <div className="bg-white p-8 shadow-xl rounded-xl text-center space-y-4">
          <h1 className="text-2xl font-bold">学生プロフィールが見つかりません</h1>
          <p className="text-gray-600">選択した学生の情報が見つかりませんでした。</p>
          <Link
            href="/company/students"
            className="inline-block bg-linear-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            学生検索に戻る
          </Link>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/company/students"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline text-lg"
        >
          <ArrowLeft size={20} />
          学生検索に戻る
        </Link>

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
            <p className="text-sm text-gray-600">学生プロフィール</p>
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
